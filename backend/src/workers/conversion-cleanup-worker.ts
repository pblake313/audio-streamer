import {
    getFirestore,
    Timestamp,
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import { ConvertedFileDoc } from "../types/ConvertedFiles";

const SIX_HOURS = 6 * 60 * 60 * 1000;

let isRunning = false;

async function runJob() {
    if (isRunning) return;

    isRunning = true;

    try {
        console.log("Running cleanup job...");

        const expiredDocs = await getExpiredConvertedDocs();

        for (const convertedDoc of expiredDocs) {
            try {
                await deleteConvertedDoc(convertedDoc);

            } catch (error) {
                console.error(`Failed to delete converted file ${convertedDoc.id}:`, error, );
            }
        }


    } catch (error) {
        console.error("Cleanup job failed:", error);
    } finally {
        isRunning = false;
    }
}

export function startConvertedFileCleanupWorker() {
    void runJob();

    setInterval(() => {
        void runJob();
    }, SIX_HOURS);
}

async function getExpiredConvertedDocs(): Promise<ConvertedFileDoc[]> {
    const snapshot = await getFirestore()
        .collection("WavConversions")
        .where("expiresAt", "<=", Timestamp.now())
        .orderBy("expiresAt", "asc")
        .limit(25)
        .get();

    return snapshot.docs.map(
        (doc) =>
            ({
                id: doc.id,
                ...doc.data(),
            }) as ConvertedFileDoc,
    );
}

async function deleteConvertedDoc(
    convertedDoc: ConvertedFileDoc,
): Promise<void> {
    if (!convertedDoc.id) {
        throw new Error("Converted document ID is missing.");
    }

    if (!convertedDoc.storagePath) {
        throw new Error(
            `Storage path is missing for ${convertedDoc.id}.`,
        );
    }

    const storageFile = getStorage()
        .bucket()
        .file(convertedDoc.storagePath);

    // Delete the actual MP3 from Firebase Storage.
    await storageFile.delete({
        ignoreNotFound: true,
    });

    // Only delete the Firestore document after Storage succeeds.
    await getFirestore()
        .collection("WavConversions")
        .doc(convertedDoc.id)
        .delete();
}