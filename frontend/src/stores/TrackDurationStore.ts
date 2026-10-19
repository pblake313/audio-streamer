import { writable } from "svelte/store";
import type { Beat } from "../lib/types/Beats";

/*
 * Track lengths for older tracks that were saved before the backend
 * started storing durationSeconds. Only the audio file's metadata is
 * loaded (not the audio itself), a few at a time, and each track is
 * only looked up once per session.
 */
export const trackDurations = writable<Record<string, number>>({});

const MAX_AT_ONCE = 3;
const requested = new Set<string>();
const queue: Beat[] = [];
let active = 0;

function runNext() {
    if (active >= MAX_AT_ONCE) return;

    const beat = queue.shift();
    if (!beat) return;

    active += 1;

    const audio = new Audio();
    audio.preload = "metadata";

    const done = () => {
        audio.removeAttribute("src");
        audio.load();
        active -= 1;
        runNext();
    };

    audio.addEventListener(
        "loadedmetadata",
        () => {
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                trackDurations.update((all) => ({ ...all, [beat.id]: audio.duration }));
            }
            done();
        },
        { once: true },
    );

    audio.addEventListener("error", done, { once: true });

    audio.src = beat.mp3Url;
}

export function requestTrackDuration(beat: Beat) {
    if (beat.durationSeconds || !beat.mp3Url || requested.has(beat.id)) return;

    requested.add(beat.id);
    queue.push(beat);
    runNext();
}
