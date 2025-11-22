import { Request, Response } from "express";
import { validateEditBeatRequest } from "../../helpers/FormHelpers/edit-beat-helpers";
import { io } from "../../../server";
import { Beat } from "../../Interfaces/beat.interface";
import { getBeatById, updateBeat } from "../../helpers/beats";
import admin from "firebase-admin";
import sharp from "sharp";

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

        const newArtwork = files.newArtwork ? files.newArtwork[0] : null;
        if (newArtwork) {
            io.to(socketId).emit("updateStatus", "Uploading new artwork.");
            await uploadBeatArtwork(newArtwork, socketId, originalBeat.id);
        }

        const newMp3 = files.newMp3File ? files.newMp3File[0] : null;
        if (newMp3) {
            io.to(socketId).emit("updateStatus", "Uploading new mp3 preview.");
            await uploadBeatMp3(newMp3, socketId, originalBeat.id);
        }

        io.to(socketId).emit("updateStatus", "Updating beat");

        console.log(validRequest.customTag)

        // 🔥 New: pass an object instead of 10 separate args
        const updatedBeat = await updateBeat(originalBeat.id, {
            beatTitle: validRequest.beatTitle,
            tagOne: validRequest.tagOne,
            tagTwo: validRequest.tagTwo,
            mood: validRequest.mood,
            bpm: validRequest.bpm,
            key: validRequest.key,
            mode: validRequest.mode,
            customTag: validRequest.customTag || '',
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

const uploadBeatArtwork = async (
    file: Express.Multer.File,
    socketId: string,
    beatId: string
): Promise<string> => {
    const bucket = admin.storage().bucket();
    let fileName = `Beats/${beatId}/Artwork/${beatId}`;
    io.to(socketId).emit("uploadStarted", "artwork");

    // Check if the file is an image and convert to WebP
    let fileBuffer = file.buffer;
    if (file.mimetype.startsWith("image/")) {
        try {
            fileBuffer = await sharp(file.buffer).webp().toBuffer();
        } catch (error) {
            console.log(error);
            throw new Error("Error converting image to WebP format.");
        }
    }

    const fileUpload = bucket.file(fileName);

    return new Promise((resolve, reject) => {
        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype.startsWith("image/")
                    ? "image/webp"
                    : file.mimetype
            }
        });

        blobStream.on("error", (error) => {
            console.log(error);
            return reject({
                message: "Unable to upload file, something went wrong.",
                fileName: file.originalname
            });
        });

        blobStream.on("finish", () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
            io.to(socketId).emit("uploadComplete", "artwork");

            resolve(publicUrl);
        });

        blobStream.end(fileBuffer);
    });
};

const uploadBeatMp3 = async (
    file: Express.Multer.File,
    socketId: string,
    beatId: string
): Promise<string> => {
    const bucket = admin.storage().bucket();
    let fileName = `Beats/${beatId}/MP3Preview/${beatId}`;
    io.to(socketId).emit("uploadStarted", "mp3");

    let fileBuffer = file.buffer;

    const fileUpload = bucket.file(fileName);

    return new Promise((resolve, reject) => {
        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype
            }
        });

        blobStream.on("error", (error) => {
            console.log(error);
            return reject({
                message: "Unable to upload file, something went wrong.",
                fileName: file.originalname
            });
        });

        blobStream.on("finish", () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
            io.to(socketId).emit("uploadComplete", "mp3");

            resolve(publicUrl);
        });

        blobStream.end(fileBuffer);
    });
};
