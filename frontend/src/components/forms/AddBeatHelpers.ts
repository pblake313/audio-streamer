const validTrackTypes = ["Beat", "Reference"] as const;

export type TrackType = (typeof validTrackTypes)[number];

export type AddBeatFormValues = {
    title: string | null;
    tagOne: string | null;
    tagTwo: string | null;
    mood: string | null;
    customTag: string | null;
    customTagColor: string | null;
    key: string | null;
    mode: string | null;
    bpm: number | null;
    artworkFile: File | null;
    // a WAV, an MP3, or both
    mp3File: File | null;
    wavFile: File | null;
    // optional stems zip
    stemsFile: File | null;
    trackType: TrackType;
};

function isValidTrackType(value: unknown): value is TrackType {
    return validTrackTypes.includes(value as TrackType);
}

export function validateAddBeatForm(form: AddBeatFormValues) {
    const title = form.title?.trim();

    if (!title) {
        throw new Error("Enter a valid beat title.");
    }

    if (!isValidTrackType(form.trackType)) {
        throw new Error("Invalid track type.");
    }

    // references don't need a key, mode, or BPM; beats do
    const isBeat = form.trackType === "Beat";

    if (isBeat && !form.key) {
        throw new Error("Select a key.");
    }

    if (isBeat && !form.mode) {
        throw new Error("Select a mode.");
    }

    if ((isBeat || form.bpm) && (!form.bpm || form.bpm < 1 || form.bpm > 199)) {
        throw new Error("BPM must be between 1 and 199.");
    }

    if (!form.artworkFile) {
        throw new Error("Please upload an artwork image.");
    }

    if (!form.mp3File && !form.wavFile) {
        throw new Error("Upload a WAV file, an MP3 file, or both.");
    }

    return true;
}

export function buildAddBeatFormData(form: AddBeatFormValues): FormData {
    validateAddBeatForm(form);

    const formData = new FormData();

    formData.append("title", form.title!.trim());
    formData.append("tagOne", form.tagOne ?? "");
    formData.append("tagTwo", form.tagTwo ?? "");
    formData.append("mood", form.mood ?? "");
    formData.append("customTag", form.customTag ?? "");
    formData.append("customTagColor", form.customTagColor ?? "");
    formData.append("key", form.key ?? "");
    formData.append("mode", form.mode ?? "");
    formData.append("bpm", form.bpm ? String(form.bpm) : "");
    formData.append("trackType", form.trackType);

    formData.append("artworkFile", form.artworkFile!);

    if (form.mp3File) {
        formData.append("mp3File", form.mp3File);
    }

    if (form.wavFile) {
        formData.append("wavFile", form.wavFile);
    }

    if (form.stemsFile) {
        formData.append("stemsFile", form.stemsFile);
    }

    return formData;
}