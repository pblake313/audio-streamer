// Helpers for chords placed on a beat timeline (no overlaps, gaps are rests).

import { BEATS_PER_BAR, type Chord } from "./chords";

export type ChordSlot = Chord & { id: number };

export function sortByStart<T extends Chord>(chords: T[]) {
    return chords.slice().sort((a, b) => a.start - b.start);
}

/** The room a chord has: where the previous chord ends and the next one starts. */
export function boundsFor(chords: ChordSlot[], id: number, totalBeats: number) {
    const sorted = sortByStart(chords);
    const i = sorted.findIndex((c) => c.id === id);

    const prev = sorted[i - 1];
    const next = sorted[i + 1];

    return {
        prevEnd: prev ? prev.start + prev.beats : 0,
        nextStart: Math.min(next ? next.start : Infinity, totalBeats),
    };
}

/** Which beats in the loop are covered by a chord. */
export function occupiedBeats(chords: Chord[], totalBeats: number) {
    const taken = new Array<boolean>(totalBeats).fill(false);
    for (const c of chords) {
        for (let b = c.start; b < Math.min(c.start + c.beats, totalBeats); b++) {
            taken[b] = true;
        }
    }
    return taken;
}

/** Length for a new chord dropped on `start`: to the end of the bar, or the next chord. */
export function defaultLengthAt(chords: Chord[], start: number, totalBeats: number) {
    const barEnd = (Math.floor(start / BEATS_PER_BAR) + 1) * BEATS_PER_BAR;
    const nextStart = chords
        .filter((c) => c.start > start)
        .reduce((min, c) => Math.min(min, c.start), totalBeats);

    return Math.max(1, Math.min(barEnd, nextStart) - start);
}

export const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));
