import { randomUUID } from "crypto";
import { isValidBpm } from "../validators/BpmValidator";

export function validateAddBeatRequest(req: any): boolean  {

    if (!req.body.title || req.body.title.trim() === '') {
        return false;
    }

    if (!isValidBpm(+req.body.bpm)){
        return false
    }

    if (!req.body.key || req.body.key.trim() === '') {
        return false;
    }

    if (!req.body.mode || req.body.mode.trim() === '') {
        return false;
    }

    return true; 

}

export function buildBeatObj(req: any): any{
    
    try {
        let validRequest = validateAddBeatRequest(req)

        if (!validRequest){
            throw new Error('The request you sent to the server was invalid.')
        } 

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


