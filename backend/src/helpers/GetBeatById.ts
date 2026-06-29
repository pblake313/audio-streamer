import * as admin from 'firebase-admin';
import { Beat } from '../types/Beat';
const db = admin.firestore();

export async function getBeatById(beatId: string): Promise<Beat> {
    try {
        const beatDoc = await db.collection('Beats').doc(beatId).get();
        
        if (!beatDoc.exists) {
            throw new Error('Could not find beat by id.')
        } else {
            // Explicitly cast the returned data to Beat
            return beatDoc.data() as Beat;
        }
    } catch (error) {
        throw error;
    }
}


