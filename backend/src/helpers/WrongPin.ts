import admin from 'firebase-admin';
import { WrongPinDoc } from '../Interfaces/wrongPin.interface';

const db = admin.firestore();
const COLLECTION = 'wrongPinAttempts';

// Create a fresh wrong-pin doc for an IP (after deleting any previous ones)
export async function createWrongPinDocument(ip: string): Promise<WrongPinDoc> {
    console.log(ip);

    try {
        const now = new Date();

        const docData: Omit<WrongPinDoc, 'id'> = {
            ip,
            dateCreated: now,
            attempts: 1,
            blocked: false,
            lastTouched: now
        };

        // Step 1: Query for existing docs with same IP
        const existingDocs = await db
            .collection(COLLECTION)
            .where('ip', '==', ip)
            .get();

        // Step 2: Delete each matching doc
        const deletePromises = existingDocs.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        // Step 3: Add new doc
        const newDocRef = await db.collection(COLLECTION).add(docData);
        console.log('Wrong PIN attempt logged.');

        // Return full typed doc (id is NOT stored in Firestore, just returned)
        return {
            id: newDocRef.id,
            ...docData
        };
    } catch (err) {
        throw err;
    }
}

// Fetch the latest wrong-pin doc for an IP
export async function getWrongPinDocByIP(ip: string): Promise<WrongPinDoc | null> {
    try {
        const snapshot = await db
            .collection(COLLECTION)
            .where('ip', '==', ip)
            .get();

        if (snapshot.empty) {
            return null;
        }

        // There should only be one doc because you delete duplicates first
        const doc = snapshot.docs[0];

        return {
            id: doc.id,
            ...(doc.data() as Omit<WrongPinDoc, 'id'>)
        };
    } catch (err) {
        throw err;
    }
}

export async function incrementLastPinDoc(ip: string): Promise<WrongPinDoc> {
    const MAX_ATTEMPTS = 5;

    return db.runTransaction(async (tx) => {
        // 1️⃣ Find the doc by IP inside the transaction
        const querySnap = await tx.get(
            db.collection(COLLECTION).where('ip', '==', ip)
        );

        if (querySnap.empty) {
            throw new Error(`WrongPin doc not found for ip ${ip}`);
        }

        const docSnap = querySnap.docs[0];
        const docRef = docSnap.ref;

        const data = docSnap.data() as Omit<WrongPinDoc, 'id'>;

        // 2️⃣ Update attempts + lastTouched
        const now = new Date();
        const newAttempts = (data.attempts ?? 0) + 1;

        // 3️⃣ Determine if blocked
        const blocked = newAttempts >= MAX_ATTEMPTS;

        // 4️⃣ Apply update in Firestore
        tx.update(docRef, {
            attempts: newAttempts,
            lastTouched: now,
            blocked
        });

        // 5️⃣ Return updated doc
        return {
            id: docRef.id,
            ...data,
            attempts: newAttempts,
            lastTouched: now,
            blocked
        };
    });
}

// help me delete the wrong pin doc by ip...

export async function deleteWrongPinDocByIP(ip: string): Promise<void> {
    try {
        const snapshot = await db
            .collection(COLLECTION)
            .where('ip', '==', ip)
            .get();

        if (snapshot.empty) {
            return; // nothing to delete
        }

        const deleteOps = snapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deleteOps);
    } catch (err) {
        throw err;
    }
}
