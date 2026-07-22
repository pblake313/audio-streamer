import { NextFunction, Request, Response } from "express";
import * as admin from "firebase-admin";
import type { ConvertedFileDoc } from "../../../types/ConvertedFiles";

const db = admin.firestore();

const convertedFilesPageSize =
    Number(process.env.CONVERTED_FILES_PAGE_SIZE) || 10;

export async function getConvertedFilesByPage(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {

        const page = Number(req.params.page || 1);
        const limit = convertedFilesPageSize;

        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).send({
                message: "Invalid page number.",
            });
        }

        const offset = (page - 1) * limit;

        /*
         * Fetch one extra document so hasMore is accurate.
         */
        const snapshot = await db
            .collection("WavConversions")
            .orderBy("createdAt", "desc")
            .offset(offset)
            .limit(limit + 1)
            .get();

        const hasMore = snapshot.docs.length > limit;

        const files: ConvertedFileDoc[] = snapshot.docs
            .slice(0, limit)
            .map((doc) => {
                const data = doc.data();

                return {
                    ...data,
                    id: doc.id,
                } as ConvertedFileDoc;
            });

        return res.status(200).send({
            message: "Converted files fetched successfully.",
            page,
            files,
            hasMore,
        });
    } catch (err) {
        next(err);
    }
}