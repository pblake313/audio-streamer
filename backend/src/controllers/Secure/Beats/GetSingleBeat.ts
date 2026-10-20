import { NextFunction, Request, Response } from "express";
import { getBeatById } from "../../../helpers/GetBeatById";
import { signBeatAudioUrls } from "../../../helpers/SignFirestoreUrl";

export async function getSingleBeat(req: Request, res: Response, next: NextFunction) {
    const beatId = req.params.beatId

    try {
        if (!beatId) throw new Error('Missing Beat Id')

        const fetchedBeat = await signBeatAudioUrls(await getBeatById(beatId))

        return res.status(200).send({beat: fetchedBeat})
    } catch (error: any) {
        next(error)
    }
}
