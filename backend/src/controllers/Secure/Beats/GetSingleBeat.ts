import { NextFunction, Request, Response } from "express";
import { getBeatById } from "../../../helpers/GetBeatById";
import { signFirestoreUrl } from "../../../helpers/SignFirestoreUrl";

export async function getSingleBeat(req: Request, res: Response, next: NextFunction) {
    const beatId = req.params.beatId

    try {
        if (!beatId) throw new Error('Missing Beat Id')

        const fetchedBeat = await getBeatById(beatId)
        fetchedBeat.mp3Url = await signFirestoreUrl(fetchedBeat.mp3Url, 0, 1)

        return res.status(200).send({beat: fetchedBeat})
    } catch (error: any) {
        next(error)
    }
}