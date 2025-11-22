import { writable } from "svelte/store";

export const isUpdatingBeatFromModal = writable<boolean>(false)