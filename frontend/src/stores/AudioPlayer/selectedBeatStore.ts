import { get, writable } from "svelte/store";
import type { Beat } from "../../lib/types/Beats";
import { audioPlayerUrl } from "../AudioPlayerStore";
import { beats } from "./beatArrayStore";

const backendLink = import.meta.env.VITE_BACKEND_URL;
const selectedBeat = writable<Beat | null>(null);

// Select a specific beat
function selectNewBeat(beat: Beat) {
    selectedBeat.set(beat);
    setAudioUrl(beat);
}

// Set audio URL based on beat ID
function setAudioUrl(beat: Beat) {
    audioPlayerUrl.set(`${backendLink}/secure/stream/stream-beat/${beat.id}`);
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
