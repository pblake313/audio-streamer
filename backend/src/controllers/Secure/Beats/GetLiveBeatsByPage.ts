import { Request, Response } from "express";

import * as admin from 'firebase-admin';
const db = admin.firestore();
import { getStorage } from 'firebase-admin/storage';
import { Beat } from "../../../Interfaces/beat.interface";

export async function getLiveBeatsByPage(req: Request, res: Response) {
    try {

        const page = parseInt(req.params.page, 10); // Parse the page parameter as an integer

        if (isNaN(page) || page <= 0) {
            // If it's not a valid positive number, return an error response
            throw new Error('Invalid page number parameter. It must be a positive number.')
        }
    
        const beatResults = await handleGetBeatsByPage(page);


        return res.status(200).send({ beats: beatResults.beats, fullBatch: beatResults.hasFullBatch });
    } catch (error: any) {
        console.error('Error occurred while getting live beats:', error);
        return res.status(500).send({ error: 'An error occurred while getting live beats', message: error.message || 'An unknwon error has occurred.' });
    }  
}


async function handleGetBeatsByPage(pageNumber: number): Promise<{ beats: Beat[]; hasFullBatch: boolean }> {
    try {
        const limitCount = 25; // Number of documents per page
        const beatsCollection = db.collection('Beats').orderBy('uploadDate', 'desc');
        
        let query = beatsCollection.limit(limitCount);

        if (pageNumber > 1) {
            // Get the last document from the previous page
            const lastPageSnapshot = await beatsCollection
                .limit((pageNumber - 1) * limitCount)
                .get(); 

            if (lastPageSnapshot.docs.length > 0) {
                const lastDoc = lastPageSnapshot.docs[lastPageSnapshot.docs.length - 1];
                query = beatsCollection.startAfter(lastDoc).limit(limitCount);
            } else {
                return { beats: [], hasFullBatch: false }; // No documents in this range
            }
        }

        const liveBeatsSnapshot = await query.get();

        if (liveBeatsSnapshot.empty) {
            return { beats: [], hasFullBatch: false };
        }

        const liveBeats: Beat[] = [];
        const bucket = getStorage().bucket();
        const signedExpiryMs = Date.now() + 1000 * 60 * 60 * 48; // 48 hours

        
        for (const doc of liveBeatsSnapshot.docs) {
            const beat = doc.data() as Beat;
            beat.id = doc.id;
 
            // Sign artwork if it exists
            if (beat.artworkUrl) {
                const artworkFile = bucket.file(`Beats/${beat.id}/Artwork/${beat.id}`);
                const [artworkSignedUrl] = await artworkFile.getSignedUrl({
                    version: "v4",
                    action: "read",
                    expires: signedExpiryMs,
                });
                beat.artworkUrl = artworkSignedUrl;
            }

            // Sign mp3 preview if it exists
            if (beat.mp3previewUrl) {
                const mp3File = bucket.file(`Beats/${beat.id}/MP3Preview/${beat.id}`);
                const [mp3SignedUrl] = await mp3File.getSignedUrl({
                    version: "v4",
                    action: "read",
                    expires: signedExpiryMs,
                });
                beat.mp3previewUrl = mp3SignedUrl;
            }

            liveBeats.push(beat); 
        }

        // Determine if the query returned a full batch (5 documents)
        const hasFullBatch = liveBeatsSnapshot.docs.length === limitCount;

        return { beats: liveBeats, hasFullBatch: hasFullBatch };
    } catch (error) {
        throw new Error('Error getting live beats');
    }
}

