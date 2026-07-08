import * as admin from 'firebase-admin';
import { Beat } from '../types/Beat';
import { AppError } from '../errors/AppError';
const db = admin.firestore();

export async function getBeatById(beatId: string): Promise<Beat> {
    try {
        const beatDoc = await db.collection('Beats').doc(beatId).get();
        
        if (!beatDoc.exists) {
            throw new AppError(404, `Could not find beat with id "${beatId}"`, {
                code: 'BEAT_NOT_FOUND'
            })
        } else {
            // Explicitly cast the returned data to Beat
            return beatDoc.data() as Beat;
        }
    } catch (error) {
        throw error;
    }
}


