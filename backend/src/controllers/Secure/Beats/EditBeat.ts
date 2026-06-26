import { Request, Response } from "express";
import { io } from "../../../../server";
import { Beat } from "../../../Interfaces/beat.interface";
import { getBeatById } from "../../../helpers/GetBeatById";
import { uploadBeatArtwork, uploadBeatMp3 } from "../../../helpers/BeatFileUploads";
import { validateEditBeatRequest } from "../../../helpers/EditBeatHelpers";
import { updateBeat } from "../../../helpers/UpdateBeatHelper";


export async function editBeat(req: Request, res: Response) {
  try {
    const beatId = req.params.beatId;
    const socketId = req.headers["x-socket-id"] as string;

    io.to(socketId).emit("updateStatus", "Validating Request");

    const validRequest = validateEditBeatRequest(req);

    if (!validRequest) {
      throw new Error("Invalid request.");
    }

    if (!socketId) {
      throw new Error("Missing Socket ID");
    }

    io.to(socketId).emit("updateStatus", "Getting latest beat data.");
    const originalBeat: Beat | null = await getBeatById(beatId);

    if (!originalBeat || !originalBeat.id) {
      throw new Error(
        "There was an error fetching the latest beat data. Please try again later."
      );
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    // ---- NEW ARTWORK ----
    const newArtwork = files.newArtwork ? files.newArtwork[0] : null;
    if (newArtwork) {
      io.to(socketId).emit("updateStatus", "Uploading new artwork.");

      await uploadBeatArtwork({
        file: newArtwork,
        beatId: originalBeat.id,
      });
    }

    // ---- NEW MP3 PREVIEW ----
    const newMp3 = files.newMp3File ? files.newMp3File[0] : null;
    if (newMp3) {
      io.to(socketId).emit("updateStatus", "Uploading new mp3 preview.");

      await uploadBeatMp3({
        file: newMp3,
        beatId: originalBeat.id,
      });
    }

    io.to(socketId).emit("updateStatus", "Updating beat");

    // Update Firestore record
    const updatedBeat = await updateBeat(originalBeat.id, {
      beatTitle: validRequest.beatTitle,
      tagOne: validRequest.tagOne,
      tagTwo: validRequest.tagTwo,
      mood: validRequest.mood,
      bpm: validRequest.bpm,
      key: validRequest.key,
      mode: validRequest.mode,
      customTag: validRequest.customTag || "",
      customTagColor: validRequest.customTagColor,
      futureDestinations: validRequest.futureDestinations
    });

    return res.status(200).send({ updatedBeat });

  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'An unknown error has occurred.'
    });
  }
}
