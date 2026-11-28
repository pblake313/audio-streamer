// How rich shuffled chords are. Each chord is picked on its own from a mix,
// and higher levels shift the mix from plain triads toward 7ths, 9ths and
// 11ths/13ths. "random" keeps the original behavior: the whole progression is
// triads or 7ths, by coin flip.

import { ROOTS, type Quality } from "./chords";
import { diatonicChord, type SimpleChord } from "./suggestions";

export type Complexity = "random" | "simple" | "light" | "medium" | "rich" | "wild";

export const COMPLEXITY_OPTIONS: { value: Complexity; label: string; hint: string }[] = [
    { value: "random", label: "Random", hint: "all triads or all 7th chords, picked at random" },
    { value: "simple", label: "1 · Simple", hint: "plain triads" },
    { value: "light", label: "2 · Light", hint: "mostly triads, with a little color" },
    { value: "medium", label: "3 · Medium", hint: "a mix of triads and 7th chords" },
    { value: "rich", label: "4 · Rich", hint: "mostly 7ths and 9ths, a few 11ths and 13ths" },
    { value: "wild", label: "5 · Wild", hint: "rich chords plus a few from outside the key" },
];

type Level = Exclude<Complexity, "random">;

/** How rich one chord is, from plainest to richest. */
type Tier = "triad" | "color" | "seventh" | "ninth" | "extended";
const TIERS: Tier[] = ["triad", "color", "seventh", "ninth", "extended"];

// the mix for each level: weights per tier (each chord is drawn separately)
const MIX: Record<Level, Record<Tier, number>> = {
    simple: { triad: 100, color: 0, seventh: 0, ninth: 0, extended: 0 },
    light: { triad: 70, color: 20, seventh: 10, ninth: 0, extended: 0 },
    medium: { triad: 40, color: 20, seventh: 30, ninth: 10, extended: 0 },
    rich: { triad: 20, color: 15, seventh: 30, ninth: 25, extended: 10 },
    wild: { triad: 10, color: 10, seventh: 25, ninth: 30, extended: 25 },
};

const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

function drawTier(level: Level): Tier {
    const weights = MIX[level];
    let roll = Math.random() * TIERS.reduce((sum, t) => sum + weights[t], 0);
    for (const tier of TIERS) {
        roll -= weights[tier];
        if (roll < 0) return tier;
    }
    return "triad";
}

// ---------- one chord on a scale degree ----------

// richer versions of the 9th chords, for "extended": each adds one note
// (11th on minor chords, 13th on dominants, 6th on majors)
const EXTEND: Partial<Record<Quality, { quality: Quality; adds: number }>> = {
    m9: { quality: "m11", adds: 5 },
    "9": { quality: "13", adds: 9 },
    maj9: { quality: "6/9", adds: 9 },
};

// gentle colors on a plain triad, each with the note it adds above the root
const COLORS: Partial<Record<Quality, { quality: Quality; adds: number }[]>> = {
    "": [
        { quality: "add9", adds: 2 },
        { quality: "sus2", adds: 2 },
        { quality: "sus4", adds: 5 },
        { quality: "6", adds: 9 },
    ],
    m: [
        { quality: "madd9", adds: 2 },
        { quality: "m6", adds: 9 },
    ],
};

/** The largest nameable chord of up to `size` notes stacked in thirds. */
function stacked(keyPc: number, steps: number[], degree: number, size: 3 | 4 | 5): SimpleChord {
    for (let s = size; s >= 3; s--) {
        const chord = diatonicChord(keyPc, steps, degree, s as 3 | 4 | 5);
        if (chord) return chord;
    }
    // every 7-note scale gives a nameable triad, so this is only a safety net
    return { root: ROOTS[(keyPc + steps[degree]) % 12], quality: "" };
}

/** A chord on a scale degree at one tier. Extra notes always come from the key. */
function chordAt(keyPc: number, steps: number[], degree: number, tier: Tier): SimpleChord {
    const inKey = (pc: number) => steps.some((step) => (keyPc + step) % 12 === pc % 12);

    if (tier === "triad") return stacked(keyPc, steps, degree, 3);
    if (tier === "seventh") return stacked(keyPc, steps, degree, 4);

    if (tier === "color") {
        const triad = stacked(keyPc, steps, degree, 3);
        const rootPc = ROOTS.indexOf(triad.root);
        const options = (COLORS[triad.quality] ?? []).filter((c) => inKey(rootPc + c.adds));
        return options.length ? { ...triad, quality: pick(options).quality } : triad;
    }

    const ninth = stacked(keyPc, steps, degree, 5);
    if (tier === "ninth") return ninth;

    const ext = EXTEND[ninth.quality];
    return ext && inKey(ROOTS.indexOf(ninth.root) + ext.adds) ? { ...ninth, quality: ext.quality } : ninth;
}

// ---------- outside the key ("wild") ----------

const isDiminished = (q: Quality) => q === "dim" || q === "dim7" || q === "m7b5";
const isDominant = (q: Quality) => q === "7" || q === "9" || q === "13" || q === "7b9" || q === "11";

/**
 * A few chords become the dominant of the chord after them (a secondary
 * dominant, e.g. A7 leading to Dm), and in a major key IV may turn into the
 * borrowed minor iv. At least one change, so the level always sounds different.
 * The chord at `keep` is left alone, so the progression keeps a plain chord.
 */
function addChromaticMoves(chords: SimpleChord[], keyPc: number, majorKey: boolean, keep: number): SimpleChord[] {
    const result = [...chords];
    const n = result.length;
    const dominantOf = (chord: SimpleChord) => ROOTS[(ROOTS.indexOf(chord.root) + 7) % 12];

    // positions that can lead into the next chord: not the opening chord, not
    // into a diminished chord, and not where its dominant is already played
    const candidates = result
        .map((_, i) => i)
        .filter((i) => {
            if (i === 0 || i === keep || n < 2) return false;
            const next = result[(i + 1) % n];
            if (isDiminished(next.quality)) return false;
            return !(result[i].root === dominantOf(next) && isDominant(result[i].quality));
        });

    const leadInto = (i: number) => {
        const next = result[(i + 1) % n];
        result[i] = { root: dominantOf(next), quality: pick(["7", "7", "9", "7b9", "13"] as const) };
    };

    let changed = 0;
    for (const i of candidates) {
        if (Math.random() < 0.3) {
            leadInto(i);
            changed++;
        }
    }
    if (!changed && candidates.length) leadInto(pick(candidates));

    // borrowed iv (Fm or Fm6 in C major) where a plain IV still stands
    if (majorKey) {
        const ivRoot = ROOTS[(keyPc + 5) % 12];
        result.forEach((chord, i) => {
            if (i !== keep && chord.root === ivRoot && !isDominant(chord.quality) && Math.random() < 0.4) {
                result[i] = { root: ivRoot, quality: pick(["m", "m6", "m9"] as const) };
            }
        });
    }
    return result;
}

// ---------- a whole progression ----------

/**
 * The chords for a list of scale degrees (one per bar) at a complexity.
 * `steps` is the key's 7-note scale; `majorKey` enables the borrowed iv.
 */
export function chordsAtComplexity(
    keyPc: number,
    steps: number[],
    degrees: number[],
    complexity: Complexity,
    majorKey: boolean,
): SimpleChord[] {
    // the original behavior: one size for the whole progression
    if (complexity === "random") {
        const tier: Tier = Math.random() < 0.5 ? "triad" : "seventh";
        return degrees.map((degree) => chordAt(keyPc, steps, degree, tier));
    }

    const tiers = degrees.map(() => drawTier(complexity));

    // keep every shuffle a mix, never all one kind:
    //   light: at least one chord with some color (add9, sus, 6 or a 7th)
    //   medium and up: at least one plain chord and at least one 7th or richer
    if (complexity !== "simple" && tiers.length > 1) {
        const spots = tiers.map((_, i) => i).filter((i) => i !== 0); // the opening chord can stay plain
        const fill = (from: Tier[]) => (tiers[pick(spots)] = pick(from.filter((t) => MIX[complexity][t] > 0)));

        if (complexity === "light") {
            if (tiers.every((t) => t === "triad")) fill(["color", "color", "seventh"]); // color twice as likely
        } else {
            if (!tiers.some(isPlain)) tiers[pick(tiers.map((_, i) => i))] = "triad";
            if (tiers.every(isPlain)) fill(["seventh", "ninth", "extended"]);
        }
    }

    const chords = degrees.map((degree, i) => chordAt(keyPc, steps, degree, tiers[i]));
    if (complexity !== "wild") return chords;

    // the plain chord kept above stays plain through the chromatic changes
    const keepPlain = tiers.findIndex(isPlain);
    return addChromaticMoves(chords, keyPc, majorKey, keepPlain);
}

const isPlain = (t: Tier) => t === "triad" || t === "color";
