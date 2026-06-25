import { NextFunction, Request, Response } from "express";
import { io } from '../../../../server';
import { getStorage } from 'firebase-admin/storage';
import admin from 'firebase-admin';
import { Beat } from "../../../Interfaces/beat.interface";
import { uploadBeatArtwork, uploadBeatMp3 } from "../../../helpers/BeatFileUploads";
import { buildBeatObj } from "../../../helpers/AddBeatHelpers";



const db = admin.firestore();

export async function addBeat(req: Request, res: Response, next: NextFunction) {
    try {
        let socketId = req.headers['x-socket-id'] as string;

        if (!socketId) throw new Error('A socket id header is required to use this endpoint.');

        io.to(socketId).emit('uploadStatus', 'Validating Request');

        let beatObj = buildBeatObj(req);

        io.to(socketId).emit('uploadStatus', 'Checking Files');

        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        // validate files
        io.to(socketId).emit('uploadStatus', 'Validating Files');

        const artworkFile = files.artworkFile?.[0];
        if (!artworkFile) throw new Error('An artwork file is required.');
        if (artworkFile.size > 5 * 1024 * 1024) {
            throw new Error('Artwork file is too large. Please upload a file under 5 MB.');
        }

        const mp3File = files.mp3File?.[0];
        if (!mp3File) throw new Error('An MP3 file is required.');
        if (mp3File.size > 10 * 1024 * 1024) {
            throw new Error('MP3 file is too large. Please upload a file under 10 MB.');
        }

        // ---- UPLOAD ARTWORK ----
        io.to(socketId).emit('uploadStatus', 'Uploading Artwork');

        const artworkUrl = await uploadBeatArtwork({
            file: artworkFile,
            socketId,
            beatId: beatObj.id,
            io
        });

        // ---- UPLOAD MP3 ----
        io.to(socketId).emit('uploadStatus', 'Uploading MP3');

        const mp3Url = await uploadBeatMp3({
            file: mp3File,
            socketId,
            beatId: beatObj.id,
            io
        });

        io.to(socketId).emit('uploadStatus', 'Creating beat');

        const newBeat = await createBeat(beatObj, artworkUrl, mp3Url);

        return res.status(200).send({ newBeat: newBeat });

    } catch (error) {
        next(error)

    }
}

async function createBeat(obj: any, artworkUrl: string, mp3Url: string) {
    const beat: Beat = {
        key: obj.key,
        mode: obj.mode,
        beatTitle: obj.beatTitle,
        mp3previewUrl: mp3Url,     // will get replaced with signed URL below
        artworkUrl: artworkUrl,    // will get replaced with signed URL below
        bpm: +obj.bpm,
        mood: obj.mood,
        tagOne: obj.tagOne,
        id: obj.id,
        tagTwo: obj.tagTwo,
        uploadDate: new Date(),
        rating: 0,
        notepad: null,
        customTag: obj.customTag,
        customTagColor: obj.customTagColor,
        futureDestinations: obj.futureDestinations
    };

    try {
        const docPath = `/Beats/${beat.id}`;
        const docRef = db.doc(docPath);

        await docRef.set(beat);

        const bucket = getStorage().bucket();

        // ---- SIGN ARTWORK ----
        if (artworkUrl) {
            const artworkFile = bucket.file(`Beats/${beat.id}/Artwork/${beat.id}`);

            const [artworkSignedUrl] = await artworkFile.getSignedUrl({
                version: "v4",
                action: "read",
                expires: Date.now() + 1000 * 60 * 60 * 48, // 48 hours
            });

            beat.artworkUrl = artworkSignedUrl;
        }

        // ---- SIGN MP3 PREVIEW ----
        if (mp3Url) {
            // Make sure this matches the exact path used in uploadBeatMp3
            // (your logs show: Beats/{id}/MP3Preview/{id})
            const mp3File = bucket.file(`Beats/${beat.id}/MP3Preview/${beat.id}`);

            const [mp3SignedUrl] = await mp3File.getSignedUrl({
                version: "v4",
                action: "read",
                expires: Date.now() + 1000 * 60 * 60 * 48, // 48 hours
            });

            beat.mp3previewUrl = mp3SignedUrl;
        }

        return beat;

    } catch (error) {
        throw new Error("An error uploading beat occurred.");
    }
}
