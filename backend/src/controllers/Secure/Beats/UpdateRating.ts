import { NextFunction, Request, Response } from "express";
import admin from "firebase-admin";
import type { Beat } from "../../../types/Beat";

type BeatRating = Beat["rating"];

const validRatings: BeatRating[] = [0, 1, 2, 3, 4, 5];

function isBeatRating(value: unknown): value is BeatRating {
    return typeof value === "number" && validRatings.includes(value as BeatRating);
}

export async function updateBeatRating(req: Request, res: Response, next: NextFunction) {
    try {
        const beatId = req.params.beatId;
        const newRating = req.body.newRating;

        if (!beatId) {
            throw new Error("Missing beat id.");
        }

        if (!isBeatRating(newRating)) {
            throw new Error("Invalid rating. Must be between 0 and 5.");
        }

        const beatRef = admin
            .firestore()
            .collection("Beats")
            .doc(beatId);

        const beatSnap = await beatRef.get();

        if (!beatSnap.exists) {
            throw new Error("Beat not found.");
        }
        
        await beatRef.update({
            rating: newRating,
            updatedAt: new Date()
        });

        return res.status(200).send({
            rating: newRating
        });
    } catch (err: any) {
        next(err);
    }
}