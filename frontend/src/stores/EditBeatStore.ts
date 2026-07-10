import { get, writable } from "svelte/store";
import { authorizedFetch } from "../helpers/Fetchers/authorizedFetch";
import type { Beat } from "../lib/types/Beats";
import { upsertBeat } from "./AudioPlayer/BeatsStore";

export const isFetchingBeatToEdit = writable<boolean>(false)
export const beatToEdit = writable<Beat | null>(null)
export const fetchSingleBeatError = writable<string | null>(null)

export async function fetchSingleBeat(beatId: string | null) {
    try {

        // return if we are already fetching.
        if (get(isFetchingBeatToEdit)) return


        // reset items
        beatToEdit.set(null)
        fetchSingleBeatError.set(null)

        isFetchingBeatToEdit.set(true)

        const response = await authorizedFetch(`/secure/beats/get-beat/${beatId}`)

        beatToEdit.set(response.beat)

        upsertBeat(response.beat)

    } catch (err: any){
        // console.log(err)
        const errorMessage = err.message || 'An unknown error has occurred.'
        fetchSingleBeatError.set(errorMessage)

    } finally {
        isFetchingBeatToEdit.set(false)
    }
    
}


// validate edit beat form and return form obj.

type EditBeatForm = {
    title: string | null;
    tagOne: string | null;
    tagTwo: string | null;
    customTagColor: string | null;
    customTag: string | null;
    mood: string | null;
    key: string;
    mode: string;
    trackType: string;
    bpm: number;
};

export function createValidEditBeatFormObject(
    formObj: EditBeatForm,
): FormData {
    const title = formObj.title?.trim();

    if (!title) {
        throw new Error("Track title is required.");
    }

    if (!Number.isFinite(formObj.bpm) || formObj.bpm <= 0) {
        throw new Error("Enter a valid BPM.");
    }

    if (!formObj.key) {
        throw new Error("Track key is required.");
    }

    if (!formObj.mode) {
        throw new Error("Track mode is required.");
    }

    if (!formObj.trackType) {
        throw new Error("Track type is required.");
    }

    const formData = new FormData();

    formData.append("beatTitle", title);
    formData.append("bpm", String(formObj.bpm));
    formData.append("key", formObj.key);
    formData.append("mode", formObj.mode);
    formData.append("trackType", formObj.trackType);

    formData.append("tagOne", formObj.tagOne || "");
    formData.append("tagTwo", formObj.tagTwo || "");
    formData.append("customTag", formObj.customTag?.trim() || "");
    formData.append("customTagColor", formObj.customTagColor || "");
    formData.append("mood", formObj.mood || "");

    return formData;
}

// edit beat form error.

export const editBeatFormError = writable<string | null>(null);

let editBeatFormErrorTimeout: ReturnType<typeof setTimeout> | null = null;

export function setEditBeatFormError(errorMessage: string) {
    editBeatFormError.set(errorMessage);

    if (editBeatFormErrorTimeout) {
        clearTimeout(editBeatFormErrorTimeout);
    }

    editBeatFormErrorTimeout = setTimeout(() => {
        editBeatFormError.set(null);
        editBeatFormErrorTimeout = null;
    }, 6000);
}

export function clearEditBeatFormError() {
    if (editBeatFormErrorTimeout) {
        clearTimeout(editBeatFormErrorTimeout);
        editBeatFormErrorTimeout = null;
    }

    editBeatFormError.set(null);
}