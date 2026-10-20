import { NextFunction, Request, Response } from "express";
import admin from 'firebase-admin';
import {
    getAudioDurationSeconds,
    MAX_MP3_BYTES,
    MAX_WAV_BYTES,
    uploadBeatArtwork,
    uploadBeatMp3,
    uploadBeatWav,
} from "../../../helpers/BeatFileUploads";
import { validateAddBeatRequest } from "../../../helpers/AddBeatHelpers";
import { Beat } from "../../../types/Beat";
import { signBeatAudioUrls } from "../../../helpers/SignFirestoreUrl";



const db = admin.firestore();

export async function addBeat(req: Request, res: Response, next: NextFunction) {
    try {
        // validate request
        const validatedObject = validateAddBeatRequest(req)

        // make sure we have files...
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        const artworkFile = files.artworkFile?.[0];
        if (!artworkFile) throw new Error('An artwork file is required.');
        if (artworkFile.size > 5 * 1024 * 1024) throw new Error('Artwork file is too large. Please upload a file under 5 MB.');

        // a WAV, an MP3, or both
        const mp3File = files.mp3File?.[0] ?? null;
        const wavFile = files.wavFile?.[0] ?? null;

        if (!mp3File && !wavFile) throw new Error('Upload a WAV file, an MP3 file, or both.');
        if (mp3File && mp3File.size > MAX_MP3_BYTES) throw new Error('MP3 file is too large. Please upload a file under 10 MB.');
        if (wavFile && wavFile.size > MAX_WAV_BYTES) throw new Error('WAV file is too large. Please upload a file under 100 MB.');

        // create the beat id.
        const beatId = crypto.randomUUID()

        // ---- UPLOAD ARTWORK ----

        const artworkUrl = await uploadBeatArtwork({
            file: artworkFile,
            beatId: beatId,
        });

        // ---- UPLOAD AUDIO ----

        const mp3Url = mp3File
            ? await uploadBeatMp3({ file: mp3File, beatId })
            : null;

        const wavUrl = wavFile
            ? await uploadBeatWav({ file: wavFile, beatId })
            : null;

        const durationSeconds = mp3File
            ? await getAudioDurationSeconds(mp3File, "mp3")
            : await getAudioDurationSeconds(wavFile!, "wav");

        const beatToStore: Beat = {
            ...validatedObject,
            id: beatId,
            artworkUrl,
            mp3Url,
            wavUrl,
            durationSeconds,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // set in firestore
        await db.collection("Beats").doc(beatId).set(beatToStore);

        // sign audio urls
        const createdBeat = await signBeatAudioUrls(beatToStore);

        return res.status(200).send({ createdBeat });

    } catch (error) {
        next(error)
    }
}
