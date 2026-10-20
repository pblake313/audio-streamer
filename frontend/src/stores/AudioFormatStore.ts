import { writable } from "svelte/store";
import type { Beat } from "../lib/types/Beats";

/*
 * A track can have a WAV, an MP3, or both. The preferred format plays
 * when a track has it; otherwise the other one plays. WAV is the default.
 * The choice is remembered between visits.
 */
export type AudioFormat = "wav" | "mp3";

const FORMAT_KEY = "audioPlayer.preferredFormat";

function readStoredFormat(): AudioFormat {
    try {
        return localStorage.getItem(FORMAT_KEY) === "mp3" ? "mp3" : "wav";
    } catch {
        return "wav";
    }
}

export const preferredAudioFormat = writable<AudioFormat>(
    typeof window !== "undefined" ? readStoredFormat() : "wav"
);

preferredAudioFormat.subscribe((format) => {
    try {
        localStorage.setItem(FORMAT_KEY, format);
    } catch {
        // storage unavailable (private mode, SSR); the choice just isn't remembered
    }
});

type AudioSources = Pick<Beat, "mp3Url" | "wavUrl">;

export function getAvailableFormats(beat: AudioSources | null | undefined): AudioFormat[] {
    if (!beat) return [];

    return [
        ...(beat.wavUrl ? (["wav"] as const) : []),
        ...(beat.mp3Url ? (["mp3"] as const) : []),
    ];
}

// The file to play: the preferred format if the track has it, else the other one.
export function getBeatAudioSource(
    beat: AudioSources | null | undefined,
    preferred: AudioFormat,
): { url: string; format: AudioFormat } | null {
    if (!beat) return null;

    const wav = beat.wavUrl ? { url: beat.wavUrl, format: "wav" as const } : null;
    const mp3 = beat.mp3Url ? { url: beat.mp3Url, format: "mp3" as const } : null;

    return preferred === "mp3" ? mp3 ?? wav : wav ?? mp3;
}
