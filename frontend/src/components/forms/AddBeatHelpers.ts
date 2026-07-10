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
    mp3File: File | null;
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

    if (!form.key) {
        throw new Error("Select a key.");
    }

    if (!form.mode) {
        throw new Error("Select a mode.");
    }

    if (!form.bpm || form.bpm < 1 || form.bpm > 199) {
        throw new Error("BPM must be between 1 and 199.");
    }

    if (!form.artworkFile) {
        throw new Error("Please upload an artwork image.");
    }

    if (!form.mp3File) {
        throw new Error("Please upload an MP3 preview.");
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
    formData.append("key", form.key!);
    formData.append("mode", form.mode!);
    formData.append("bpm", String(form.bpm));
    formData.append("trackType", form.trackType);

    formData.append("artworkFile", form.artworkFile!);
    formData.append("mp3File", form.mp3File!);

    return formData;
}