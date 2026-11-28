// A random starting point: a key plus a common progression that fits it.

import { BEATS_PER_BAR, ROOTS, SCALES, type Chord, type Root, type ScaleId } from "./chords";
import { chordsAtComplexity, type Complexity } from "./complexity";

// scale degrees, 0-based (0 = I/i)
type KeyScale = "major" | "minor";

const PROGRESSIONS: Record<KeyScale, number[][]> = {
    major: [
        [0, 4, 5, 3], // I  V  vi IV
        [5, 3, 0, 4], // vi IV I  V
        [0, 5, 3, 4], // I  vi IV V
        [0, 3, 4, 3], // I  IV V  IV
        [1, 4, 0, 5], // ii V  I  vi
        [3, 0, 4, 5], // IV I  V  vi
    ],
    minor: [
        [0, 5, 2, 6], // i  VI III VII
        [0, 3, 6, 2], // i  iv VII III
        [0, 6, 5, 6], // i  VII VI VII
        [0, 3, 4, 0], // i  iv v  i
        [0, 5, 3, 4], // i  VI iv v
        [5, 6, 0, 0], // VI VII i i
    ],
};


const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

// scales with 7 notes can stack thirds directly
type SevenNoteScale = Exclude<ScaleId, "none" | "majorPentatonic" | "minorPentatonic" | "blues">;

/**
 * Random chords that fit a key, one per bar.
 * Major/minor use well-known progressions; other modes get random degrees
 * starting on the tonic; pentatonic/blues borrow chords from their parent
 * major/minor key. `complexity` sets how rich the chords are ("random" =
 * triads or 7ths by coin flip).
 */
export function randomChordsInKey(keyRoot: Root, scale: ScaleId, bars: number, complexity: Complexity = "random"): Chord[] {
    const keyPc = ROOTS.indexOf(keyRoot);

    const harmony: SevenNoteScale =
        scale === "majorPentatonic" ? "major"
        : scale === "minorPentatonic" || scale === "blues" ? "minor"
        : scale === "none" ? (Math.random() < 0.5 ? "major" : "minor")
        : scale;

    const degrees: readonly number[] =
        harmony === "major" || harmony === "minor"
            ? pick(PROGRESSIONS[harmony])
            : [0, ...Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 6))];

    const steps = [...SCALES[harmony].intervals];

    // cycle the 4-chord pattern if there are more bars
    const perBar = Array.from({ length: bars }, (_, bar) => degrees[bar % degrees.length]);
    const chords = chordsAtComplexity(keyPc, steps, perBar, complexity, harmony === "major");

    return chords.map((chord, bar) => ({
        ...chord,
        start: bar * BEATS_PER_BAR,
        beats: BEATS_PER_BAR,
    }));
}

/** A random key (major or minor) with a progression that fits it. */
export function randomProgression(bars: number, complexity: Complexity = "random") {
    const keyRoot: Root = pick(ROOTS);
    const scale: KeyScale = Math.random() < 0.5 ? "major" : "minor";

    return { keyRoot, scale, chords: randomChordsInKey(keyRoot, scale, bars, complexity) };
}
