import { NextFunction, Request, Response } from "express";
import { io } from '../../../../server';
import { getStorage } from 'firebase-admin/storage';
import admin from 'firebase-admin';
import { uploadBeatArtwork, uploadBeatMp3 } from "../../../helpers/BeatFileUploads";
import { validateAddBeatRequest } from "../../../helpers/AddBeatHelpers";
import { Beat } from "../../../types/Beat";
import { signFirestoreUrl } from "../../../helpers/SignFirestoreUrl";



const db = admin.firestore();

export async function addBeat(req: Request, res: Response, next: NextFunction) {
    try {
        // validate request
        const validatedObject = validateAddBeatRequest(req)
        console.log(validatedObject)

        // make sure we have files...
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        const artworkFile = files.artworkFile?.[0];
        if (!artworkFile) throw new Error('An artwork file is required.');
        if (artworkFile.size > 5 * 1024 * 1024) throw new Error('Artwork file is too large. Please upload a file under 5 MB.');

        const mp3File = files.mp3File?.[0];
        if (!mp3File) throw new Error('An MP3 file is required.');
        if (mp3File.size > 10 * 1024 * 1024) throw new Error('MP3 file is too large. Please upload a file under 10 MB.');
        
        // create the beat id.
        const beatId = crypto.randomUUID()
        console.log(beatId)

        // ---- UPLOAD ARTWORK ----

        const artworkUrl = await uploadBeatArtwork({
            file: artworkFile,
            beatId: beatId,
        });

        const mp3Url = await uploadBeatMp3({
            file: mp3File,
            beatId: beatId,
        });

        const beatToStore: Beat = {
            ...validatedObject,
            id: beatId,
            artworkUrl,
            mp3Url,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // set in firestore 
        await db.collection("Beats").doc(beatId).set(beatToStore);

        // sign mp3 url
        beatToStore.mp3Url = await signFirestoreUrl(beatToStore.mp3Url, 0, 1)

        return res.status(200).send({ createdBeat: beatToStore});

    } catch (error) {
        next(error)
    }
}
