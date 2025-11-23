// src/stores/AudioPlayer/selectedBeatStore.ts
import { get, writable } from "svelte/store";
import type { Beat } from "../../lib/types/Beats";
import { audioPlayerState, audioPlayerUrl } from "../AudioPlayerStore";
import { beats } from "./beatArrayStore";
import { getAuthenticatedUser } from "../../helpers/Auth/authFunctions";
import { streamToken } from "../tokenStore";

const backendLink = import.meta.env.VITE_BACKEND_URL;

const selectedBeat = writable<Beat | null>(null);

// Select a specific beat
function selectNewBeat(beat: Beat) {
    selectedBeat.set(beat);
    // fire-and-forget async URL setup that authenticates first
    void setAudioUrl(beat);
}

// 👇 Now async: authenticate before setting stream URL
async function setAudioUrl(beat: Beat) {
    try {

        const st = get(streamToken)
        
        // This will hit /secure/get-authorized-user, run secureMiddleWare,
        // refresh tokens if needed, enforce IP, etc.
        await getAuthenticatedUser();

        // Only after a successful auth check do we set the audio URL
        audioPlayerUrl.set(
            `${backendLink}/secure/stream/stream-beat/${beat.id}?stream=${st}`
        );
    } catch (err) {
        console.error("Failed to authenticate before setting audio URL:", err);
        // Optionally: clear URL on auth failure
        audioPlayerUrl.set(null);
    }
}

// Select the next beat in the list
function selectNextBeat() {
    const allBeats = get(beats);
    const currentBeat = get(selectedBeat);

    if (!allBeats || allBeats.length === 0) return;

    if (!currentBeat) {
        selectNewBeat(allBeats[0]);
        return;
    }

    const currentIndex = allBeats.findIndex((b: Beat) => b.id === currentBeat.id);
    if (currentIndex === -1) {
        selectNewBeat(allBeats[0]);
        return;
    }

    const nextIndex = (currentIndex + 1) % allBeats.length;
    selectNewBeat(allBeats[nextIndex]);
}

function selectPreviousBeat() {
    const allBeats = get(beats);
    const currentBeat = get(selectedBeat);

    if (!allBeats || allBeats.length === 0) return;

    if (!currentBeat) {
        selectNewBeat(allBeats[allBeats.length - 1]);
        return;
    }

    const currentIndex = allBeats.findIndex((b: Beat) => b.id === currentBeat.id);
    if (currentIndex === -1) {
        selectNewBeat(allBeats[allBeats.length - 1]);
        return;
    }

    const previousIndex = (currentIndex - 1 + allBeats.length) % allBeats.length;
    selectNewBeat(allBeats[previousIndex]);
}

export {
    selectedBeat,
    selectNewBeat,
    selectNextBeat,
    selectPreviousBeat
};
