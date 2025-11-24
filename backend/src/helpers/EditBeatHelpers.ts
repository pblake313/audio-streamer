export function validateEditBeatRequest(req: any){
    const bpm = +req.body.bpm
    const key = req.body.key
    const mode = req.body.mode
    const beatTitle = req.body.beatTitle
    const tagOne: null | string = req.body.tagOne || null
    const tagTwo: null | string = req.body.tagTwo || null
    const mood: null | string = req.body.mood || null
    const customTag: string | null = req.body.customTag
    const customTagColor: string | null = req.body.customTagColor

    if (!bpm || bpm <= 1 || bpm >= 200){
        return null
    }
    if (!key || key.trim() === '' || typeof key !== "string") {
        return null
    }
    if (!mode || mode.trim() === '' || typeof mode !== "string") {
        return null
    }
    if (!beatTitle || beatTitle.trim() === '' || typeof beatTitle !== "string") {
        return null
    }

    if (tagOne && (typeof tagOne !== "string" || tagOne.trim() === '')) {
        return null
    }

    if (tagTwo && (typeof tagTwo !== "string" || tagTwo.trim() === '')) {
        return null
    }
    if (mood && (typeof mood !== "string" || mood.trim() === '')) {
        return null
    }

    let futureDestinations: string[] = [];

    if (req.body.futureDestinations) {
        try {
            const parsed = JSON.parse(req.body.futureDestinations);
            if (Array.isArray(parsed) && parsed.every(dest => typeof dest === 'string')) {
                futureDestinations = parsed;
            }
        } catch (error) {
            // Ignore error and leave futureDestinations as []
        }
    }

    return {
        bpm,
        key,
        mode,
        beatTitle,
        tagOne,
        tagTwo,
        mood,
        customTag,
        customTagColor,
        futureDestinations
    }
}