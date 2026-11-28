// Scales built from a key's own scale (major, or natural minor), for the
// "Scales" section: pentatonic, blues and a couple of modes per key type.
// Every scale is written as degrees of the key's scale, some raised or
// lowered, so notes keep their proper spelling (a blue note in A is E♭, not D♯).

import { scaleOf, type KeyRef } from "./keys";

// keys.ts keeps these private; the same two tiny helpers here
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11];
const mod12 = (n: number) => ((n % 12) + 12) % 12;
const spell = (letter: number, pc: number) => {
    const diff = mod12(pc - NATURAL_PC[letter] + 6) - 6;
    return LETTERS[letter] + (diff > 0 ? "#".repeat(diff) : "b".repeat(-diff));
};

const INTERVALS = [
    "Root", "Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Tritone",
    "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th", "Major 7th",
];

export type ScaleKind = "pentatonic" | "blues" | "dorian" | "harmonicMinor" | "mixolydian" | "lydian";

export type ScaleNote = {
    degree: number; // 1-7 in the key's scale; 1 is the tonic
    label: string; // the degree as shown, e.g. "5" or "♭5"
    name: string;
    pc: number;
    role: string;
    interval: string;
    /** raised or lowered from the key's own scale (drawn dashed) */
    altered: boolean;
};

type Spec = {
    id: ScaleKind;
    label: string; // the picker pill
    title: (tonic: string) => string; // the heading
    /** [degree, semitones up/down, role for an altered note] */
    notes: [number, number, string?][];
    about: string;
};

const SPECS: Record<KeyRef["mode"], Spec[]> = {
    major: [
        {
            id: "pentatonic",
            label: "Pentatonic",
            title: (t) => `${t} major pentatonic`,
            notes: [[1, 0], [2, 0], [3, 0], [5, 0], [6, 0]],
            about: "Five notes: the major scale without its 4th and 7th, the two that sit a half step from a neighbour. With no half steps left nothing clashes, which is why it's the go-to scale for solos and riffs.",
        },
        {
            id: "blues",
            label: "Blues",
            title: (t) => `${t} major blues`,
            notes: [[1, 0], [2, 0], [3, -1, "Blue note"], [3, 0], [5, 0], [6, 0]],
            about: "The major pentatonic plus the ♭3, the blue note. Slide or bend it up into the 3rd rather than landing on it: that rub is the country and blues sound.",
        },
        {
            id: "mixolydian",
            label: "Mixolydian",
            title: (t) => `${t} Mixolydian`,
            notes: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, -1, "Flat 7th"]],
            about: "The major scale with a flat 7th. Still major, but bluesy and laid back instead of sweet: classic rock, funk and jam-band territory, and a perfect fit over dominant 7th chords.",
        },
        {
            id: "lydian",
            label: "Lydian",
            title: (t) => `${t} Lydian`,
            notes: [[1, 0], [2, 0], [3, 0], [4, 1, "Raised 4th"], [5, 0], [6, 0], [7, 0]],
            about: "The major scale with a raised 4th. It takes away the one note that wants to fall, so it floats: dreamy, bright and a favourite in film scores.",
        },
    ],
    minor: [
        {
            id: "pentatonic",
            label: "Pentatonic",
            title: (t) => `${t} minor pentatonic`,
            notes: [[1, 0], [3, 0], [4, 0], [5, 0], [7, 0]],
            about: "Five notes: the minor scale without its 2nd and 6th, the two that sit a half step from a neighbour. With no half steps left nothing clashes, which is why it's the go-to scale for solos and riffs.",
        },
        {
            id: "blues",
            label: "Blues",
            title: (t) => `${t} minor blues`,
            notes: [[1, 0], [3, 0], [4, 0], [5, -1, "Blue note"], [5, 0], [7, 0]],
            about: "The minor pentatonic plus the ♭5, the blue note. It's a passing note: slide through it on the way to the 4th or 5th rather than sitting on it.",
        },
        {
            id: "dorian",
            label: "Dorian",
            title: (t) => `${t} Dorian`,
            notes: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 1, "Raised 6th"], [7, 0]],
            about: "The minor scale with a raised 6th. Less sad, more cool: the minor sound of funk, soul and a lot of jazz, and it fits a minor chord moving to a major IV.",
        },
        {
            id: "harmonicMinor",
            label: "Harmonic minor",
            title: (t) => `${t} harmonic minor`,
            notes: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 1, "Leading tone"]],
            about: "The minor scale with a raised 7th, a leading tone that pulls hard back home (it's where the major V chord in minor comes from). The wide gap from the 6th up to it gives the exotic, neoclassical sound.",
        },
    ],
};

export const scaleKinds = (mode: KeyRef["mode"]) => SPECS[mode].map(({ id, label }) => ({ id, label }));

function specFor(key: KeyRef, kind: ScaleKind) {
    return SPECS[key.mode].find((spec) => spec.id === kind) ?? SPECS[key.mode][0];
}

export function buildScale(key: KeyRef, kind: ScaleKind) {
    const parent = scaleOf(key);
    const spec = specFor(key, kind);
    const tonicPc = parent[0].pc;

    const notes: ScaleNote[] = spec.notes.map(([degree, alter, role]) => {
        const base = parent[degree - 1];
        const pc = mod12(base.pc + alter);
        return {
            degree,
            label: (alter < 0 ? "♭" : alter > 0 ? "♯" : "") + degree,
            name: spell(base.letter, pc),
            pc,
            role: role ?? base.role,
            interval: INTERVALS[mod12(pc - tonicPc)],
            altered: alter !== 0,
        };
    });

    return {
        id: spec.id,
        title: spec.title,
        about: spec.about,
        notes,
        /** pitch classes the neck positions are built from; blues uses the pentatonic boxes */
        boxPcs: notes.filter((note) => !(spec.id === "blues" && note.altered)).map((note) => note.pc),
        extraPcs: notes.filter((note) => spec.id === "blues" && note.altered).map((note) => note.pc),
    };
}

// scales in URLs: ?scale=blues, harmonic-minor, ...
const ALL_KINDS: ScaleKind[] = ["pentatonic", "blues", "dorian", "harmonicMinor", "mixolydian", "lydian"];

/** "harmonicMinor" -> "harmonic-minor" */
export const scaleSlug = (kind: ScaleKind) => kind.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);

/** Reads ?scale=, forgiving case and separators ("Harmonic Minor", "harmonic_minor"). */
export function parseScaleKind(text: string | null | undefined): ScaleKind | null {
    if (!text) return null;
    const clean = text.toLowerCase().replace(/[\s_-]+/g, "");
    return ALL_KINDS.find((kind) => kind.toLowerCase() === clean) ?? null;
}

/** Whether `kind` exists for keys of this type (Dorian is a minor-key option, Lydian a major one). */
export const hasScaleKind = (mode: KeyRef["mode"], kind: ScaleKind) => SPECS[mode].some((spec) => spec.id === kind);
