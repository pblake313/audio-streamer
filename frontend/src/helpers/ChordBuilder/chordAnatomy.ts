// How a chord is built, for the hover card on each chord in the timeline:
// a one-line recipe, and every note with the job it does (root, 3rd, 9th...).

import {
    QUALITIES,
    ROOTS,
    chordLabel,
    chordSpokenName,
    detectChord,
    type Chord,
    type Quality,
} from "./chords";
import { VIBES } from "./suggestions";

export type ChordPart = { note: string; role: string };

export type ChordAnatomy = {
    name: string; // "F#6/9"
    spoken: string; // "F sharp major 6/9"
    recipe: string; // how it's stacked
    parts: ChordPart[]; // root first, then upward
    vibe: string | null;
    bass: string | null; // the bass note when it isn't the root (slash chords)
};

// how each chord type is put together
const RECIPES: Record<Quality, string> = {
    "": "A major triad: the root, a major 3rd and a perfect 5th.",
    m: "A minor triad: the root, a minor 3rd and a perfect 5th.",
    "7": "A major triad plus a minor 7th, the tension that wants to resolve.",
    maj7: "A major triad plus a major 7th, a half step below the root.",
    m7: "A minor triad plus a minor 7th.",
    m9: "A minor 7th chord with a 9th stacked on top.",
    maj9: "A major 7th chord with a 9th stacked on top.",
    add9: "A major triad with a 9th added, and no 7th.",
    sus2: "The 3rd is swapped for a 2nd, so it's neither major nor minor.",
    sus4: "The 3rd is swapped for a 4th, so it's neither major nor minor.",
    dim: "A minor 3rd with a flattened 5th: two minor 3rds stacked.",
    m7b5: "A diminished triad plus a minor 7th (half-diminished).",
    aug: "A major 3rd with a raised 5th: two major 3rds stacked.",
    "6": "A major triad with a 6th added, and no 7th.",
    m6: "A minor triad with a major 6th added.",
    "9": "A dominant 7th chord with a 9th stacked on top.",
    "7sus4": "A dominant 7th chord with the 3rd swapped for a 4th.",
    madd9: "A minor triad with a 9th added, and no 7th.",
    mMaj7: "A minor triad plus a major 7th.",
    dim7: "A diminished triad plus a diminished 7th: three minor 3rds stacked.",
    "7b9": "A dominant 7th chord with a flattened 9th on top.",
    "13": "A dominant 9th chord with a 13th on top (the 11th is left out).",
    "5": "Just the root and the 5th, with no 3rd (a power chord).",
    "1": "A single note: just the root.",
    "6/9": "A major triad with an added 6th and 9th, and no 7th.",
    m11: "A minor 9th chord with an 11th stacked on top.",
    "11": "A dominant 9th chord with an 11th stacked on top.",
    m7add11: "A minor 7th chord with an 11th added (no 9th).",
    add11: "A major triad with an 11th added, and no 7th.",
};

// a chord type's own intervals (in semitones, above an octave for extensions)
// → the name of that note's job
function roleOfInterval(interval: number, quality: Quality): string {
    switch (interval) {
        case 0: return "Root";
        case 2: return "2nd";
        case 3: return "minor 3rd";
        case 4: return "major 3rd";
        case 5: return "4th";
        case 6: return "flat 5th";
        case 7: return "5th";
        case 8: return "sharp 5th";
        case 9: return quality === "dim7" ? "diminished 7th" : "6th";
        case 10: return "minor 7th";
        case 11: return "major 7th";
        case 13: return "flat 9th";
        case 14: return "9th";
        case 17: return "11th";
        case 21: return "13th";
        default: return `${interval} semitones`;
    }
}

/**
 * Roles for notes that don't come from a known chord type (hand-edited
 * chords), from each note's distance above the root, using the other notes
 * as context: e.g. a 2 is a "9th" when there's a 3rd, a "2nd" when there isn't.
 */
function roleOfPitchClass(semis: number, present: Set<number>): string {
    const has = (s: number) => present.has(s);
    const third = has(3) || has(4);
    const seventh = has(10) || has(11);
    switch (semis) {
        case 0: return "Root";
        case 1: return "flat 9th";
        case 2: return third ? "9th" : "2nd";
        case 3: return has(4) ? "sharp 9th" : "minor 3rd";
        case 4: return "major 3rd";
        case 5: return third ? "11th" : "4th";
        case 6: return has(7) ? "sharp 11th" : "flat 5th";
        case 7: return "5th";
        case 8: return has(7) ? "flat 13th" : "sharp 5th";
        case 9: return seventh ? "13th" : has(6) && has(3) && !has(7) ? "diminished 7th" : "6th";
        case 10: return "minor 7th";
        case 11: return "major 7th";
        default: return "";
    }
}

const rootOfLabel = (label: string) => label.match(/^[A-G](#|b)?/)?.[0] ?? null;

// ---------- spelling ----------

// which letter each job lands on, counted from the root's letter (a 3rd is two
// letters up, so the 3rd of F# is an A: A#, not Bb)
const DEGREE_OF_ROLE: Record<string, number> = {
    Root: 1,
    "2nd": 2, "9th": 2, "flat 9th": 2, "sharp 9th": 2,
    "minor 3rd": 3, "major 3rd": 3,
    "4th": 4, "11th": 4, "sharp 11th": 4,
    "flat 5th": 5, "5th": 5, "sharp 5th": 5,
    "6th": 6, "13th": 6, "flat 13th": 6,
    "minor 7th": 7, "major 7th": 7, "diminished 7th": 7,
};

const LETTERS = "CDEFGAB";
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

/** The note `semis` above the root, spelled on the right letter for its job. */
function spell(rootName: string, semis: number, role: string): string {
    const fallback = ROOTS[(ROOTS.indexOf(rootName as (typeof ROOTS)[number]) + semis) % 12];
    const degree = DEGREE_OF_ROLE[role];
    const rootLetter = LETTERS.indexOf(rootName[0]);
    if (!degree || rootLetter < 0) return fallback;

    const rootPc = ROOTS.indexOf(rootName as (typeof ROOTS)[number]);
    const letter = (rootLetter + degree - 1) % 7;
    const offset = (((rootPc + semis - LETTER_PC[letter]) % 12) + 12) % 12;

    // keep it to one sharp or flat; double accidentals read worse than the plain name
    if (offset === 0) return LETTERS[letter];
    if (offset === 1) return `${LETTERS[letter]}#`;
    if (offset === 11) return `${LETTERS[letter]}b`;
    return fallback;
}

export function chordAnatomy(chord: Pick<Chord, "root" | "quality" | "notes" | "slashBass">): ChordAnatomy {
    const name = chordLabel(chord);
    const spoken = chordSpokenName(chord);

    // a chord type the app knows, voiced automatically (or a transcription
    // with a slash bass): read the roles straight from its intervals
    if (!chord.notes || chord.slashBass) {
        const parts = QUALITIES[chord.quality].intervals.map((interval) => {
            const role = roleOfInterval(interval, chord.quality);
            return { note: spell(chord.root, interval % 12, role), role };
        });
        return {
            name,
            spoken,
            recipe: RECIPES[chord.quality],
            parts,
            vibe: VIBES[chord.quality] ?? null,
            bass: chord.slashBass && chord.slashBass !== chord.root ? chord.slashBass : null,
        };
    }

    // hand-edited: explain the notes actually played
    const sorted = [...chord.notes].sort((a, b) => a - b);
    const pcs = [...new Set(sorted.map((n) => n % 12))];
    const detected = detectChord(sorted);
    const rootName = detected?.root ?? rootOfLabel(name) ?? ROOTS[sorted[0] % 12];
    const rootPc = ROOTS.indexOf(rootName as (typeof ROOTS)[number]);
    const bassName = ROOTS[sorted[0] % 12];

    const above = new Set(pcs.map((pc) => (pc - rootPc + 12) % 12));
    const parts = [...above]
        .sort((a, b) => a - b)
        .map((semis) => {
            const role = roleOfPitchClass(semis, above);
            return { note: spell(rootName, semis, role), role };
        });

    const recipe = detected
        ? RECIPES[detected.quality]
        : pcs.length === 1
          ? "A single note, played in one or more octaves."
          : "Hand-edited notes. Each one's job is shown below, counted up from the root.";

    return {
        name,
        spoken,
        recipe,
        parts,
        vibe: detected ? (VIBES[detected.quality] ?? null) : null,
        bass: bassName !== rootName ? bassName : null,
    };
}
