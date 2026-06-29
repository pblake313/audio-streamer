export function createEditBeatFormData({
    tagOne,
    tagTwo,
    mood,
    key,
    mode,
    beatTitle,
    bpm,
    newArtworkFile,
    newMp3File,
    customTag, 
    customTagColor,
    futureDestinations
} : {
    tagOne: string | null,
    tagTwo: string | null,
    mood: string | null,
    key: string | null,
    mode: string | null,
    beatTitle: string | null,
    bpm: number | null,
    newArtworkFile:File | null,
    newMp3File: File | null,
    customTag: string,
    customTagColor: string | null,
    futureDestinations: string[]
}) {
    const formData = new FormData();

    if (tagOne) {
        formData.append('tagOne', tagOne);
    }
    if (customTag) {
        formData.append('customTag', customTag);
    }
    if (customTagColor) {
        formData.append('customTagColor', customTagColor);
    }
    if (tagTwo) {
        formData.append('tagTwo', tagTwo);
    }
    if (mood) {
        formData.append('mood', mood);
    }
    if (key){
        formData.append('key', key);
    }
    if (mode){
        formData.append('mode', mode);
    }
    if (bpm) {
        formData.append('bpm', bpm.toString());
    }
    if (beatTitle){
        formData.append('beatTitle', beatTitle);
    }
    if (newArtworkFile) {
        formData.append('newArtwork', newArtworkFile);
    }
    if (newMp3File) {
        formData.append('newMp3File', newMp3File);
    }
    if (futureDestinations && futureDestinations.length > 0) {
        formData.append('futureDestinations', JSON.stringify(futureDestinations));
    }
    return formData;
}
