import { get, writable } from "svelte/store";
import type { Beat } from "../lib/types/Beats";
import { pushNotification } from "./NotificationStore";

export const trackA = writable<Beat | null>(null);
export const trackB = writable<Beat | null>(null);

export const trackAAudioElement =
    writable<HTMLAudioElement | undefined>(undefined);

export const trackBAudioElement =
    writable<HTMLAudioElement | undefined>(undefined);

export function selectABTrack(beat: Beat) {
    const currentTrackA = get(trackA);
    const currentTrackB = get(trackB);

    // Do not allow the same track in both slots.
    if (
        currentTrackA?.id === beat.id ||
        currentTrackB?.id === beat.id
    ) {
        setABError('Track already selected. Cannot add again.')
        return;
    }

    // Always fill Track A first.
    if (!currentTrackA) {
        trackA.set(beat);
        return;
    }

    // Then fill Track B.
    if (!currentTrackB) {
        trackB.set(beat);
        return;
    }

    // Both slots are filled, so replace the currently selected slot.
    const selected = get(selectedAB);

    const audioA = get(trackAAudioElement);
    const audioB = get(trackBAudioElement);

    // Stop playback before replacing either track.
    audioA?.pause();
    audioB?.pause();

    abAudioPlayerState.set("paused");

    if (selected === "A") {
        if (audioA) {
            audioA.currentTime = 0;
        }

        trackA.set(beat);
        return;
    }

    if (audioB) {
        audioB.currentTime = 0;
    }

    trackB.set(beat);
}


export function resetABTester() {
    const audioA = get(trackAAudioElement);
    const audioB = get(trackBAudioElement);

    audioA?.pause();
    audioB?.pause();

    if (audioA) {
        audioA.currentTime = 0;
        audioA.muted = false;
    }

    if (audioB) {
        audioB.currentTime = 0;
        audioB.muted = false;
    }

    trackA.set(null);
    trackB.set(null);

    selectedAB.set("A");
    abAudioPlayerState.set("paused");

    abError.set(null);

    if (abErrorTimeout) {
        clearTimeout(abErrorTimeout);
        abErrorTimeout = null;
    }
}

export function clearABTrack(beat: Beat) {
    const currentTrackA = get(trackA);
    const currentTrackB = get(trackB);

    if (currentTrackA?.id === beat.id) {
        const audio = get(trackAAudioElement);

        audio?.pause();

        if (audio) {
            audio.currentTime = 0;
        }

        trackA.set(null);
        return;
    }

    if (currentTrackB?.id === beat.id) {
        const audio = get(trackBAudioElement);

        audio?.pause();

        if (audio) {
            audio.currentTime = 0;
        }

        trackB.set(null);
    }
}

export function clearAllABTracks() {
    const audioA = get(trackAAudioElement);
    const audioB = get(trackBAudioElement);

    audioA?.pause();
    audioB?.pause();

    if (audioA) audioA.currentTime = 0;
    if (audioB) audioB.currentTime = 0;

    trackA.set(null);
    trackB.set(null);
}

export const selectedAB = writable<'A' | 'B'>('A')


export const abAudioPlayerState = writable<'playing' | 'paused'>('paused')


function updateABMutedTracks() {
    const selected = get(selectedAB);
    const audioA = get(trackAAudioElement);
    const audioB = get(trackBAudioElement);

    if (audioA) {
        audioA.muted = selected !== "A";
    }

    if (audioB) {
        audioB.muted = selected !== "B";
    }
}

export async function abHandlePlayPause() {
    const audioA = get(trackAAudioElement);
    const audioB = get(trackBAudioElement);
    const state = get(abAudioPlayerState);
    const selected = get(selectedAB);

    if (!audioA && !audioB) {
        setABError("Select Track A and Track B");
        return;
    }

    if (!audioA) {
        setABError("Select Track A");
        return;
    }

    if (!audioB) {
        setABError("Select Track B");
        return;
    }

    updateABMutedTracks();

    if (state === "playing") {
        audioA?.pause();
        audioB?.pause();

        abAudioPlayerState.set("paused");
        return;
    }

    const selectedAudio =
        selected === "A"
            ? audioA ?? audioB
            : audioB ?? audioA;

    if (selectedAudio) {
        if (audioA && audioA !== selectedAudio) {
            audioA.currentTime = selectedAudio.currentTime;
        }

        if (audioB && audioB !== selectedAudio) {
            audioB.currentTime = selectedAudio.currentTime;
        }
    }

    const results = await Promise.allSettled([
        ...(audioA ? [audioA.play()] : []),
        ...(audioB ? [audioB.play()] : []),
    ]);

    const startedPlaying = results.some(
        (result) => result.status === "fulfilled",
    );

    abAudioPlayerState.set(
        startedPlaying ? "playing" : "paused",
    );
}

export function toggleAB() {
    selectedAB.update((current) =>
        current === "A" ? "B" : "A",
    );

    updateABMutedTracks();
}

export function selectAB(track: "A" | "B") {
    selectedAB.set(track);
    updateABMutedTracks();
}



export const abError = writable<string | null>(null);

let abErrorTimeout: ReturnType<typeof setTimeout> | null = null;

export function setABError(message: string) {
    abError.set(message);

    if (abErrorTimeout) {
        clearTimeout(abErrorTimeout);
    }

    abErrorTimeout = setTimeout(() => {
        abError.set(null);
        abErrorTimeout = null;
    }, 6000);
}