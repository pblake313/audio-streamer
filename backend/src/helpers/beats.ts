import * as admin from 'firebase-admin';
import { Beat } from '../Interfaces/beat.interface';
const db = admin.firestore();
import { getStorage } from 'firebase-admin/storage';


export async function getBeatById(beatId: string): Promise<Beat | null> {
    try {
        const beatDoc = await db.collection('Beats').doc(beatId).get();
        
        if (!beatDoc.exists) {
            throw new Error('Could not find beat by id.')
        } else {
            // Explicitly cast the returned data to Beat
            return beatDoc.data() as Beat;
        }
    } catch (error) {
        console.error('Error fetching beat by ID:', error);
        throw error;
    }
}

type BeatUpdateInput = {
    beatTitle?: string;
    tagOne?: string | null;
    tagTwo?: string | null;
    mood?: string | null;
    bpm?: number;
    key?: string;
    mode?: string;
    customTag?: string | null;
    customTagColor?: string | null;
    futureDestinations?: string[];
    rating?: Beat['rating'];
    notepad?: string | null;        
};

export async function updateBeat(
    beatId: string,
    updates: BeatUpdateInput
): Promise<Beat> {
    try {
        const beatRef = db.collection('Beats').doc(beatId);

        const payload: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
            ...(updates.beatTitle !== undefined && { beatTitle: updates.beatTitle }),
            ...(updates.tagOne !== undefined && { tagOne: updates.tagOne }),
            ...(updates.tagTwo !== undefined && { tagTwo: updates.tagTwo }),
            ...(updates.mood !== undefined && { mood: updates.mood }),
            ...(updates.bpm !== undefined && { bpm: updates.bpm }),
            ...(updates.key !== undefined && { key: updates.key }),
            ...(updates.mode !== undefined && { mode: updates.mode }),
            ...(updates.customTag !== undefined && { customTag: updates.customTag || "" }),
            ...(updates.customTagColor !== undefined && {
                customTagColor: updates.customTagColor || ""
            }),
            ...(updates.futureDestinations !== undefined && {
                futureDestinations: updates.futureDestinations || []
            }),
            ...(updates.rating !== undefined && { rating: updates.rating }),
            ...(updates.notepad !== undefined && { notepad: updates.notepad }) 
        };

        await beatRef.update(payload); // ← throws if doc doesn't exist

        const updatedDoc = await beatRef.get();
        if (!updatedDoc.exists) {
            throw new Error(`Beat with ID ${beatId} does not exist after update.`);
        }

        const updatedBeat = updatedDoc.data() as Beat;
        updatedBeat.id = updatedDoc.id;

        const bucket = getStorage().bucket();
        if (updatedBeat.artworkUrl) {
            const file = bucket.file(`Beats/${beatId}/Artwork/${beatId}`);
            const [url] = await file.getSignedUrl({
                version: "v4",
                action: "read",
                expires: Date.now() + 1000 * 60 * 60 * 26
            });
            updatedBeat.artworkUrl = url;
        }

        return updatedBeat;
    } catch (error) {
        console.error("Error updating beat:", error);
        throw new Error("Error updating beat");
    }
}



export async function getLiveBeats(pageNumber: number): Promise<{ beats: Beat[]; hasFullBatch: boolean }> {
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

        for (const doc of liveBeatsSnapshot.docs) {
            const beat = doc.data() as Beat;
            beat.id = doc.id;
 
            if (beat.artworkUrl) {
                const file = bucket.file(`Beats/${beat.id}/Artwork/${beat.id}`);
                const [url] = await file.getSignedUrl({
                    version: 'v4',
                    action: 'read',
                    expires: Date.now() + 1000 * 60 * 60 * 48 // 48 hours
                });
                beat.artworkUrl = url;
            }

            liveBeats.push(beat); 
        }

        // Determine if the query returned a full batch (5 documents)
        const hasFullBatch = liveBeatsSnapshot.docs.length === limitCount;

        return { beats: liveBeats, hasFullBatch: hasFullBatch };
    } catch (error) {
        console.error('Error getting live beats:', error);
        throw new Error('Error getting live beats');
    }
}



export async function getBeats(limit?: number): Promise<Beat[]> {
    try {
        // Reference to the Beats collection
        let query = db.collection('Beats').orderBy('uploadDate', 'desc');

        // Apply limit if provided
        if (limit) {
            query = query.limit(limit);
        }

        // Execute the query
        const beatsSnapshot = await query.get();

        if (beatsSnapshot.empty) {
            return [];
        }

        const beats: Beat[] = [];

        // Process each document
        for (const doc of beatsSnapshot.docs) {
            const beat = doc.data() as Beat;
            beat.id = doc.id;
            beats.push(beat);
        }

        return beats;
    } catch (error) {
        console.error('Error fetching beats:', error);
        throw new Error('Error fetching beats');
    }
}
