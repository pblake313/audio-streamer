import { nameChord } from "./chordNaming";

// Basic chord theory: roots, qualities, and turning a chord into MIDI notes.

export const ROOTS = [
    "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
] as const;

export type Root = (typeof ROOTS)[number];

// intervals in semitones from the root
export const QUALITIES = {
    "": { label: "Major", intervals: [0, 4, 7] },
    m: { label: "Minor", intervals: [0, 3, 7] },
    "7": { label: "Dominant 7", intervals: [0, 4, 7, 10] },
    maj7: { label: "Major 7", intervals: [0, 4, 7, 11] },
    m7: { label: "Minor 7", intervals: [0, 3, 7, 10] },
    m9: { label: "Minor 9", intervals: [0, 3, 7, 10, 14] },
    maj9: { label: "Major 9", intervals: [0, 4, 7, 11, 14] },
    add9: { label: "Add 9", intervals: [0, 4, 7, 14] },
    sus2: { label: "Sus 2", intervals: [0, 2, 7] },
    sus4: { label: "Sus 4", intervals: [0, 5, 7] },
    dim: { label: "Diminished", intervals: [0, 3, 6] },
    m7b5: { label: "Half-diminished", intervals: [0, 3, 6, 10] },
    aug: { label: "Augmented", intervals: [0, 4, 8] },
    "6": { label: "Major 6", intervals: [0, 4, 7, 9] },
    m6: { label: "Minor 6", intervals: [0, 3, 7, 9] },
    "9": { label: "Dominant 9", intervals: [0, 4, 7, 10, 14] },
    "7sus4": { label: "7 Sus 4", intervals: [0, 5, 7, 10] },
    madd9: { label: "Minor Add 9", intervals: [0, 3, 7, 14] },
    mMaj7: { label: "Minor Major 7", intervals: [0, 3, 7, 11] },
    dim7: { label: "Diminished 7", intervals: [0, 3, 6, 9] },
    "7b9": { label: "7 Flat 9", intervals: [0, 4, 7, 10, 13] },
    "13": { label: "Dominant 13", intervals: [0, 4, 7, 10, 14, 21] },
    // used by transcribed progressions
    "5": { label: "Power chord", intervals: [0, 7] }, // root + 5th, no 3rd
    "1": { label: "Root only", intervals: [0] }, // a single note (no 3rd, no 5th)
    "6/9": { label: "Major 6/9", intervals: [0, 4, 7, 9, 14] },
    m11: { label: "Minor 11", intervals: [0, 3, 7, 10, 14, 17] },
    "11": { label: "Dominant 11", intervals: [0, 4, 7, 10, 14, 17] },
    m7add11: { label: "Minor 7 add 11", intervals: [0, 3, 7, 10, 17] },
    add11: { label: "Add 11", intervals: [0, 4, 7, 17] },
} as const;

export type Quality = keyof typeof QUALITIES;

export type Chord = {
    root: Root;
    quality: Quality;
    start: number; // beat position in the loop (0-based)
    beats: number; // how long the chord lasts
    notes?: number[] | null; // hand-edited MIDI notes; null = auto voicing
    // bass note of a transcribed inversion (e.g. "F#" for Esus2/F#), so it keeps
    // its written name; cleared as soon as the notes are edited
    slashBass?: Root | null;
};

export const BEATS_PER_BAR = 4;

// scales for the key selector, as semitones from the key's root
export const SCALES = {
    none: { label: "No scale", intervals: [] },
    major: { label: "Major", intervals: [0, 2, 4, 5, 7, 9, 11] },
    minor: { label: "Minor", intervals: [0, 2, 3, 5, 7, 8, 10] },
    dorian: { label: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
    phrygian: { label: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
    lydian: { label: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
    mixolydian: { label: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10] },
    harmonicMinor: { label: "Harmonic Minor", intervals: [0, 2, 3, 5, 7, 8, 11] },
    melodicMinor: { label: "Melodic Minor", intervals: [0, 2, 3, 5, 7, 9, 11] },
    majorPentatonic: { label: "Major Pentatonic", intervals: [0, 2, 4, 7, 9] },
    minorPentatonic: { label: "Minor Pentatonic", intervals: [0, 3, 5, 7, 10] },
    blues: { label: "Blues", intervals: [0, 3, 5, 6, 7, 10] },
} as const;

export type ScaleId = keyof typeof SCALES;

/** Pitch classes (0-11) in the key, or null when no scale is picked. */
export function scalePitchClasses(root: Root, scale: ScaleId) {
    if (scale === "none") return null;
    const rootPc = ROOTS.indexOf(root);
    return new Set<number>(SCALES[scale].intervals.map((i) => (rootPc + i) % 12));
}

export function chordName(chord: Pick<Chord, "root" | "quality">) {
    if (chord.quality === "1") return chord.root; // a lone note is just its name
    return `${chord.root}${chord.quality}`;
}

// MIDI 60 = middle C, "C3" in the piano roll's Ableton-style labels
const VOICING_LOW = 60; // chords sit from C3 up to B3, extensions above

// highest note anything may use: MIDI 96, C6 in Ableton naming. The piano
// roll shows up to C5 and grows an octave for anything above it
export const MAX_NOTE = 96;
export const BASS_OCTAVE_C = 48; // the bass note sits in the C2 octave, just under the chord

/**
 * Close voicing kept between C3 and B3 (Ableton labels), so moving between
 * chords stays smooth instead of jumping around the keyboard.
 */
export function chordNotes(chord: Pick<Chord, "root" | "quality">) {
    const rootPc = ROOTS.indexOf(chord.root);
    const { intervals } = QUALITIES[chord.quality];

    const voicing = intervals
        .map((interval) => {
            // extensions (9ths) stay above the triad
            if (interval >= 12) return null;

            let note = rootPc + interval;
            while (note < VOICING_LOW) note += 12;
            while (note >= VOICING_LOW + 12) note -= 12;
            return note;
        })
        .filter((n): n is number => n !== null)
        .sort((a, b) => a - b);

    // add extensions on top of the voicing, folding them down an octave
    // (into the chord) if that would go past the highest allowed note
    for (const interval of intervals) {
        if (interval < 12) continue;
        let note = rootPc + interval;
        while (note <= voicing[voicing.length - 1]) note += 12;
        while (note - 12 > voicing[voicing.length - 1]) note -= 12;
        while (note > MAX_NOTE) note -= 12;
        if (!voicing.includes(note)) voicing.push(note);
    }
    voicing.sort((a, b) => a - b);

    const bass = BASS_OCTAVE_C + rootPc;

    return { bass, voicing };
}

/** The notes a chord actually plays, low to high: hand-edited or auto-voiced. */
export function effectiveNotes(chord: Pick<Chord, "root" | "quality" | "notes">) {
    if (chord.notes && chord.notes.length) {
        return [...chord.notes].sort((a, b) => a - b);
    }
    const { bass, voicing } = chordNotes(chord);
    return [bass, ...voicing];
}

/**
 * Names a set of notes, e.g. [39, 55, 58, 60, 63] -> Cm7 over Eb.
 * Prefers the reading whose root is the bass note.
 */
export function detectChord(notes: number[]) {
    if (notes.length < 2) return null;

    const sorted = [...notes].sort((a, b) => a - b);
    const bassPc = sorted[0] % 12;
    const pcs = new Set(sorted.map((n) => n % 12));

    const matches: { root: Root; quality: Quality }[] = [];

    ROOTS.forEach((root, rootPc) => {
        if (!pcs.has(rootPc)) return;

        for (const quality of Object.keys(QUALITIES) as Quality[]) {
            const shape = new Set(QUALITIES[quality].intervals.map((i) => (rootPc + i) % 12));
            if (shape.size === pcs.size && [...shape].every((pc) => pcs.has(pc))) {
                matches.push({ root, quality });
            }
        }
    });

    if (!matches.length) return null;

    const best = matches.find((m) => ROOTS.indexOf(m.root) === bassPc) ?? matches[0];
    return { ...best, bass: ROOTS[bassPc] };
}

/** Display name; hand-edited chords are re-detected, with slash bass if needed. */
export function chordLabel(chord: Pick<Chord, "root" | "quality" | "notes" | "slashBass">) {
    if (chord.slashBass) return `${chordName(chord)}/${chord.slashBass}`;
    if (!chord.notes) return chordName(chord);

    // hand-edited notes: name whatever they spell (extensions, alterations, slash chords)
    return nameChord(chord.notes);
}

const NOTE_NAMES =["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

/**
 * Octave names follow Ableton (and Logic/Cubase): middle C, MIDI note 60, is
 * "C3". So the piano roll's labels match what you see after exporting the MIDI
 * into Ableton. (Scientific naming would call it C4; FL Studio calls it C5.)
 * e.g. 60 -> "C3", 36 -> "C1"
 */
export const MIDDLE_C_OCTAVE = 3;

export function noteName(midi: number) {
    return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - (5 - MIDDLE_C_OCTAVE)}`;
}

export function isBlackKey(midi: number) {
    return [1, 3, 6, 8, 10].includes(midi % 12);
}

export function midiToFrequency(midi: number) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

// ---------- plain-English chord names ----------

const SPOKEN_QUALITY: Record<Quality, string> = {
    "": "major",
    m: "minor",
    "7": "dominant 7th",
    maj7: "major 7th",
    m7: "minor 7th",
    m9: "minor 9th",
    maj9: "major 9th",
    add9: "major add 9",
    sus2: "suspended 2nd",
    sus4: "suspended 4th",
    dim: "diminished",
    m7b5: "half-diminished",
    aug: "augmented",
    "6": "major 6th",
    m6: "minor 6th",
    "9": "dominant 9th",
    "7sus4": "dominant 7th, suspended 4th",
    madd9: "minor add 9",
    mMaj7: "minor major 7th",
    dim7: "diminished 7th",
    "7b9": "dominant 7th, flat 9",
    "13": "dominant 13th",
    "5": "power chord",
    "1": "(root note only)",
    "6/9": "major 6/9",
    m11: "minor 11th",
    "11": "dominant 11th",
    m7add11: "minor 7th add 11",
    add11: "major add 11",
};

/** "C#" -> "C sharp", "Eb" -> "E flat" */
export const spokenNote = (name: string) => name.replace("#", " sharp").replace(/^([A-G])b$/, "$1 flat");

/**
 * The chord said out loud: Am7 -> "A minor 7th", A7 -> "A dominant 7th",
 * C/E -> "C major over E". Hand-edited chords that don't match a known type
 * are read out as their notes.
 */
export function chordSpokenName(chord: Pick<Chord, "root" | "quality" | "notes" | "slashBass">) {
    if (chord.slashBass) return `${spokenNote(chord.root)} ${SPOKEN_QUALITY[chord.quality]} over ${spokenNote(chord.slashBass)}`;
    if (!chord.notes) return `${spokenNote(chord.root)} ${SPOKEN_QUALITY[chord.quality]}`;

    const sorted = [...chord.notes].sort((a, b) => a - b);
    if (new Set(sorted.map((n) => n % 12)).size === 1) return `${spokenNote(NOTE_NAMES[sorted[0] % 12])} (single note)`;

    const detected = detectChord(sorted);
    if (detected) {
        const base = `${spokenNote(detected.root)} ${SPOKEN_QUALITY[detected.quality]}`;
        return detected.bass === detected.root ? base : `${base} over ${spokenNote(detected.bass)}`;
    }

    // no standard name: list the notes, low to high
    return [...new Set(sorted.map((n) => NOTE_NAMES[n % 12]))].map(spokenNote).join(", ");
}
