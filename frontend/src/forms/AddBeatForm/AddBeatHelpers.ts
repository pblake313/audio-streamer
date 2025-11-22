export function validateAddBeatForm(
    title: string, 
    bpm: number, 

    artworkFile: File | null,
    mp3PreviewFile: File | null,

    key: string,
    mode: string
){

    if (!title || title.trim() === ''){
        return false
    }
    if (!bpm || bpm <= 10){
        return false
    }
    if (!artworkFile){
        return false
    }
    if (!mp3PreviewFile){
        return false
    }
    if (!mode || mode.trim() === ''){
        return false
    }
    if (!key || key.trim() === ''){
        return false
    }

    return true
}

export function buildFormData({
    title,
    tagOne,
    tagTwo,
    mood,
    bpm,
    artworkFile,
    mp3File,
    key,
    mode,
    customTag,
    customTagColor
  }: {
    title: string;
    tagOne: string;
    tagTwo: string;
    mood: string;
    bpm: number;
    artworkFile: File | null;
    mp3File: File | null;
    key: string;
    mode: string;
    customTag: string;
    customTagColor: string
}): FormData {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('tagOne', tagOne);
    formData.append('tagTwo', tagTwo);
    formData.append('mood', mood)
    formData.append('bpm', bpm.toString());
    if (artworkFile){
        formData.append('artworkFile', artworkFile);
    }
    if (mp3File){
        formData.append('mp3File', mp3File);
    }
    formData.append('key', key);
    formData.append('mode', mode);
    formData.append('customTag', customTag);
    formData.append('customTagColor', customTagColor);
    return formData;
}
  

export function handleBeatBPM(event: any, bpm: string): string {
    const inputElement = event.target as HTMLInputElement;
    const currentInput = inputElement.value;
    const digitsOnly = currentInput.replace(/\D/g, ''); 

    if (digitsOnly.length <= 3) {
        bpm = digitsOnly;
        inputElement.value = bpm;
    } else {
        inputElement.value = bpm;
    }

    return bpm;
}

export function handleTagOne(event: CustomEvent): string {
    return event.detail;
}
export function handleCustomTag(event: any){
    let title = event.target.value
    return title
}

export function handleTagTwo(event: CustomEvent): string {
    return event.detail;
}

export function selectKey(event: CustomEvent): string {
    return event.detail;
}
export function selectMode(event: CustomEvent): string {
    return event.detail;
}

export function handlePrice(event: CustomEvent): number {
    return event.detail.value;
}
export function handleBpm(event: CustomEvent):number {
    return event.detail.value
}
export function handleMood(event: CustomEvent): string {
    return event.detail
}
export function handleCustomTagColor(event: CustomEvent): string {
    return event.detail
}