import { writable } from "svelte/store";

export const popupError = writable<string | null>(null);

let popupErrorTimeout: ReturnType<typeof setTimeout> | null = null;

export function setPopupError(value: string) {
    popupError.set(value);

    if (popupErrorTimeout) {
        clearTimeout(popupErrorTimeout);
    }

    popupErrorTimeout = setTimeout(() => {
        clearPopupError();
    }, 6000);
}

export function clearPopupError() {
    popupError.set(null);

    if (popupErrorTimeout) {
        clearTimeout(popupErrorTimeout);
        popupErrorTimeout = null;
    }
}