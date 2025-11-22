import { randomUUID } from "crypto";
import { Beat } from "../../Interfaces/beat.interface";
import { isValidBpm } from "../../validators/stringValidation";

export function validateAddBeatRequest(req: any): boolean  {

    if (!req.body.title || req.body.title.trim() === '') {
        console.log('fas')
        return false;
    }

    if (!isValidBpm(+req.body.bpm)){
        console.log('ds')

        return false
    }

    if (!req.body.key || req.body.key.trim() === '') {
        console.log('a')

        return false;
    }

    if (!req.body.mode || req.body.mode.trim() === '') {
        console.log('t')

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


export function isOfTypeBeat(someItem: any): someItem is Beat {
    if (typeof someItem !== 'object' || someItem === null) {
        return false;
    }

    return (
        (typeof someItem.id === 'undefined' || typeof someItem.id === 'string') &&
        typeof someItem.mp3previewUrl === 'string' &&
        typeof someItem.wavUrl === 'string' &&
        typeof someItem.artworkUrl === 'string' &&
        typeof someItem.stemsUrl === 'string' &&
        typeof someItem.beatTitle === 'string' &&
        typeof someItem.bpm === 'number' &&
        (typeof someItem.tagOne === 'string' || someItem.tagOne === null) &&
        (typeof someItem.tagTwo === 'string' || someItem.tagTwo === null) &&
        typeof someItem.wavPrice === 'number' &&
        typeof someItem.stemsPrice === 'number' &&
        typeof someItem.plays === 'number' &&
        ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'F', 'B♭', 'E♭', 'A♭'].includes(someItem.key) &&
        [
            'Major',
            'Minor',
            'Harmonic Minor',
            'Melodic Minor',
            'Dorian',
            'Phrygian',
            'Lydian',
            'Mixolydian',
            'Locrian',
        ].includes(someItem.mode) &&
        typeof someItem.isLive === 'boolean' &&
        ['Digital Download', 'Retail'].includes(someItem.productType) &&
        someItem.uploadDate instanceof Date
    );
}