import path from "node:path";

import { NextFunction, Request, Response } from "express";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

interface ConvertedFileDoc {
    filename?: string;
    mp3Filename?: string;
    storagePath: string;
    mp3Bytes?: number;
    mp3SizeBytes?: number;
}

export async function downloadConvertedFile(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const fileDocId = req.params.fileId;

        if (!fileDocId) {
            throw new Error("File ID is required.");
        }

        const fileDocSnapshot = await getFirestore()
            .collection("WavConversions")
            .doc(fileDocId)
            .get();

        if (!fileDocSnapshot.exists) {
            throw new Error("Converted file document not found.");
        }

        const fileDoc = fileDocSnapshot.data() as ConvertedFileDoc;

        if (!fileDoc.storagePath) {
            throw new Error(
                "Converted file storage path is missing.",
            );
        }

        const storageFile = getStorage()
            .bucket()
            .file(fileDoc.storagePath);

        const [fileExists] = await storageFile.exists();

        if (!fileExists) {
            throw new Error(
                "Converted file was not found in storage.",
            );
        }

        const rawFilename =
            fileDoc.mp3Filename ||
            `${removeExtension(fileDoc.filename || "converted-file")}.mp3`;

        const safeFilename = path
            .basename(rawFilename)
            .replace(/["\r\n]/g, "_");

        res.status(200);
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeFilename}"`,
        );

        const fileStream = storageFile.createReadStream();

        fileStream.on("error", (error) => {
            if (!res.headersSent) {
                next(error);
                return;
            }

            res.destroy(error);
        });

        fileStream.pipe(res);
    } catch (error) {
        next(error);
    }
}

function removeExtension(filename: string): string {
    return filename.replace(/\.[^/.]+$/, "");
}