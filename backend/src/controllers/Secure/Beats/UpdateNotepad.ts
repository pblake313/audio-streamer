import { NextFunction, Request, Response } from "express";
import admin from "firebase-admin";

export async function updateNotepad(req: Request, res: Response, next: NextFunction) {
    try {
        const beatId = req.params.beatId;
        if (!beatId) {
            throw new Error("Missing beat id.");
        }

        const newNotepad = req.body.newNotepad;

        if (typeof newNotepad !== "string") {
            throw new Error("Invalid request. Notepad must be a string.");
        }

        if (newNotepad.length > 750) {
            throw new Error("Notepad must be under 750 characters.");
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
            notepad: newNotepad,
            updatedAt: new Date()
        });

        return res.status(200).send({ notepad: newNotepad });
    } catch (err: any) {
        next(err)
    }
}