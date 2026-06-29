import { NextFunction, Request, Response } from "express";
import admin from "firebase-admin";

export async function markBeatAsTrash(req: Request, res: Response, next: NextFunction) {
    try {
        const beatId = req.params.beatId;
        if (!beatId) {
            throw new Error("Missing beat id.");
        }

        const beatRef = admin
            .firestore()
            .collection("Beats")
            .doc(beatId);

        const beatSnap = await beatRef.get();

        if (!beatSnap.exists) {
            throw new Error("Beat not found.");
        }



        const currentBeat = beatSnap.data()

        let newTag: string | null 
        let newTagColor: string | null 

        if (currentBeat?.customTag === 'Trash' && currentBeat?.customTagColor === 'ff1a1a') {
            // beat is marked as trash -- reset tags
            newTag = null
            newTagColor = null
        } else {
            newTag = "Trash"
            newTagColor = 'ff1a1a'
        }


        await beatRef.update({
            customTag: newTag,
            customTagColor: newTagColor,
            updatedAt: new Date()
        });


        return res.status(200).send({customTag: newTag, customTagColor: newTagColor })

    } catch (err: any) {
        next(err)
    }

}