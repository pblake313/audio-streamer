import { NextFunction, Request, Response } from "express";
import * as admin from "firebase-admin";
import { Beat } from "../../../types/Beat";
import { signFirestoreUrl } from "../../../helpers/SignFirestoreUrl";

const db = admin.firestore();

export async function getLiveBeatsByPage(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const page = Number(req.params.page || 1);
        const limit = 12;

        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).send({
                message: "Invalid page number.",
            });
        }

        const offset = (page - 1) * limit;

        const snapshot = await db
            .collection("Beats")
            .orderBy("createdAt", "desc")
            .offset(offset)
            .limit(limit)
            .get();

        const beats: Beat[] = await Promise.all(
            snapshot.docs.map(async (doc) => {
                const data = doc.data() as Beat;

                let signedMp3Url = data.mp3Url;

                if (data.mp3Url) {
                    signedMp3Url = await signFirestoreUrl(data.mp3Url, 0, 1);
                }

                return {
                    ...data,
                    id: doc.id,
                    mp3Url: signedMp3Url,
                } as Beat;
            })
        );

        return res.status(200).send({
            message: "Beats fetched successfully.",
            page,
            beats,
            hasMore: beats.length === limit,
        });
    } catch (error: any) {
        next(error);
    }
}