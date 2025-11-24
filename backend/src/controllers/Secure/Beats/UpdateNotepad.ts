import { Request, Response } from "express";
import { updateBeat } from "../../../helpers/UpdateBeatHelper";

export async function updateNotepad(req: Request, res: Response) {
    try {

        console.log(req.body)

        const beatId = req.params.beatId;
        const newNotepad = req.body.newNotepad;
        const newDestinations = req.body.newDestinations
        if (newNotepad && typeof newNotepad !== 'string') {
            throw new Error('Invalid Request')
        }

        // Validate futureDestinations -------------------
        if (!Array.isArray(newDestinations)) {
            throw new Error("Invalid request: destinations must be an array.");
        }
        if (!newDestinations.every((d) => typeof d === "string")) {
            throw new Error("Invalid request: destinations must contain only strings.");
        }

        const updatedBeat = await updateBeat(beatId, {
            notepad: newNotepad, 
            futureDestinations: newDestinations
        });

        return res.status(200).json({ updatedBeat });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'An unknown error has occurred.' });
    }
}