import { Request, Response } from "express";
import { getBeatById } from "../../../helpers/GetBeatById";
import { signFirestoreUrl } from "../../../helpers/SignFirestoreUrl";

export async function getSingleBeat(req: Request, res: Response) {
    const beatId = req.params.beatId

    try {
        const fetchedBeat = await getBeatById(beatId)

        if (fetchedBeat){
            fetchedBeat.artworkUrl = await signFirestoreUrl(fetchedBeat.artworkUrl, 0, 45)
        }

        return res.status(200).send({message: 'ok 4 now', beat: fetchedBeat})
    } catch {
        return res.status(500).send({ error: 'An error occurred while getting the beat.' });
    }
}