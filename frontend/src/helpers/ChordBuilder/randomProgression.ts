// A random starting point: a key plus a common progression that fits it.

import {
    BEATS_PER_BAR,
    QUALITIES,
    ROOTS,
    SCALES,
    type Chord,
    type Quality,
    type Root,
    type ScaleId,
} from "./chords";

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

/** Stacks thirds on a scale degree and names the result, e.g. degree 1 of C major -> Dm7. */
function diatonicChord(keyPc: number, scale: SevenNoteScale, degree: number, sevenths: boolean) {
    const steps = SCALES[scale].intervals;
    const stack = sevenths ? [0, 2, 4, 6] : [0, 2, 4];

    const pcs = stack.map((s) => (keyPc + steps[(degree + s) % steps.length]) % 12);
    const rootPc = pcs[0];
    const shape = pcs.map((pc) => (pc - rootPc + 12) % 12).sort((a, b) => a - b).join(",");

    const quality = (Object.keys(QUALITIES) as Quality[]).find(
        (q) => [...QUALITIES[q].intervals].sort((a, b) => a - b).join(",") === shape,
    );

    return { root: ROOTS[rootPc], quality: quality ?? (sevenths ? "m7" : "m") };
}

// scales with 7 notes can stack thirds directly
type SevenNoteScale = Exclude<ScaleId, "none" | "majorPentatonic" | "minorPentatonic" | "blues">;

/**
 * Random chords that fit a key, one per bar.
 * Major/minor use well-known progressions; other modes get random degrees
 * starting on the tonic; pentatonic/blues borrow chords from their parent
 * major/minor key.
 */
export function randomChordsInKey(keyRoot: Root, scale: ScaleId, bars: number): Chord[] {
    const keyPc = ROOTS.indexOf(keyRoot);
    const sevenths = Math.random() < 0.5;

    const harmony: SevenNoteScale =
        scale === "majorPentatonic" ? "major"
        : scale === "minorPentatonic" || scale === "blues" ? "minor"
        : scale === "none" ? (Math.random() < 0.5 ? "major" : "minor")
        : scale;

    const degrees: readonly number[] =
        harmony === "major" || harmony === "minor"
            ? pick(PROGRESSIONS[harmony])
            : [0, ...Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 6))];

    // cycle the 4-chord pattern if there are more bars
    return Array.from({ length: bars }, (_, bar) => ({
        ...diatonicChord(keyPc, harmony, degrees[bar % degrees.length], sevenths),
        start: bar * BEATS_PER_BAR,
        beats: BEATS_PER_BAR,
    }));
}

/** A random key (major or minor) with a progression that fits it. */
export function randomProgression(bars: number) {
    const keyRoot: Root = pick(ROOTS);
    const scale: KeyScale = Math.random() < 0.5 ? "major" : "minor";

    return { keyRoot, scale, chords: randomChordsInKey(keyRoot, scale, bars) };
}
