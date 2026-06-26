import { randomUUID } from "crypto";
import { isValidBpm } from "../validators/BpmValidator";
import { Request } from "express";

export function validateAddBeatRequest(req: Request) {

    console.log(req.body)

    if (1 === 1) throw new Error('temporary dev error.')


}

export function buildBeatObj(req: any): any{
    
    try {

        const beatObj = {
            beatTitle: req.body.title,
            tagOne: req.body.tagOne || null,
            tagTwo: req.body.tagTwo || null,
            mood: req.body.mood || null,
            bpm: req.body.bpm,
            key: req.body.key,
            mode: req.body.mode,
            customTag: req.body.customTag || null,
            customTagColor: req.body.customTagColor || null,
            futureDestinations: [],
            uploadDate: new Date().getTime(),
            id: randomUUID(),
        };

        return beatObj


    } catch (error) {
        throw error
    }

}


