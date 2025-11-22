import { Request, Response } from "express";
import { updateBeat } from "../../helpers/beats";

export async function updateBeatRating(req: Request, res: Response) {

    try {
        const beatId = req.params.beatId
        const newRating = req.body.newRating

        if (![0, 1, 2, 3, 4, 5].includes(newRating)) {
            throw new Error('Invalid rating. Must be between 0 and 5.')
        }

        const updatedBeat = await updateBeat(beatId, { rating: newRating });

        return res.status(200).send({beat: updatedBeat})
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'An unknown error has occurred.' });
    
    }
}