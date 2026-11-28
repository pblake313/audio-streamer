// Chord ideas for one spot in a progression, based on the key and the chords
// around it. Each idea comes with the music-theory reason it works and the
// feeling it gives, so the list teaches as well as suggests.

import {
    QUALITIES,
    ROOTS,
    SCALES,
    chordName,
    effectiveNotes,
    scalePitchClasses,
    type Quality,
    type Root,
    type ScaleId,
} from "./chords";
import { transitionTension } from "./tension";

export type SimpleChord = { root: Root; quality: Quality };

export type SuggestionGroup = "color" | "sevenths" | "dominants" | "pull" | "swap" | "borrowed";

export type Suggestion = SimpleChord & {
    name: string;
    group: SuggestionGroup;
    role: string; // e.g. "V7 of Am"
    vibe: string; // e.g. "Dreamy, warm, lush"
    reason: string;
    tensionIn: number | null; // from the previous chord into this one
    tensionOut: number | null; // from this one into the next chord
    outsideKey: string[] | null; // note names outside the key (null = no scale picked)
    order: number; // display order within its group
    score: number;
};

// ---------- the feeling of each chord type ----------

export const VIBES: Record<Quality, string> = {
    "": "Bright, stable, direct",
    m: "Sad, serious, introspective",
    "7": "Bluesy, restless, wants to move",
    maj7: "Dreamy, warm, lush",
    m7: "Mellow, soulful, laid-back",
    m9: "Smooth, sensual, late-night R&B",
    maj9: "Airy, polished, neo-soul",
    add9: "Open, shimmering, modern pop",
    sus2: "Open, floating, neither happy nor sad",
    sus4: "Suspended, yearning, begs to resolve",
    dim: "Unstable, anxious, on edge",
    m7b5: "Dark, mysterious, jazzy",
    aug: "Dreamlike, unsettling, rising",
    "6": "Sweet, vintage, settled",
    m6: "Bittersweet, film-noir, bossa nova",
    "9": "Funky, confident, jazzy",
    "7sus4": "Hovering, gospel-like anticipation",
    madd9: "Melancholy but spacious",
    mMaj7: "Eerie, spy-movie mystery",
    dim7: "Dramatic, cinematic, suspenseful",
    "7b9": "Dark, intense, flamenco/jazz pull",
    "13": "Lush, sophisticated big-band dominant",
    "5": "Raw, heavy, neither happy nor sad",
    "1": "Bare and hypnotic: just the root",
    "6/9": "Lush, dreamy, wide open",
    m11: "Deep, airy, floating minor",
    "11": "Hazy, suspended dominant",
    m7add11: "Moody and open",
    add11: "Bright with a soft clash",
};

// ---------- key helpers ----------

const pcOf = (root: Root) => ROOTS.indexOf(root);
const rootAt = (pc: number) => ROOTS[((pc % 12) + 12) % 12];
const note = (pc: number) => rootAt(pc);

const isMinorish = (q: Quality) => {
    const iv: readonly number[] = QUALITIES[q].intervals;
    return iv.includes(3) && !iv.includes(4);
};
const isDimish = (q: Quality) => q === "dim" || q === "dim7" || q === "m7b5";
const isMajorish = (q: Quality) => (QUALITIES[q].intervals as readonly number[]).includes(4);

/** 7-note scale steps used for harmony (pentatonic/blues borrow from major/minor). */
export function harmonySteps(scale: ScaleId): number[] {
    if (scale === "majorPentatonic" || scale === "none") return [...SCALES.major.intervals];
    if (scale === "minorPentatonic" || scale === "blues") return [...SCALES.minor.intervals];
    return [...SCALES[scale].intervals];
}

/** Stacks thirds on a scale degree, e.g. degree 1 of C major -> Dm7. */
const shapeKey = (intervals: readonly number[]) =>
    [...new Set(intervals.map((i) => i % 12))].sort((a, b) => a - b).join(",");

/**
 * Stacks thirds on a scale degree: 3 notes = triad, 4 = 7th chord, 5 = 9th
 * chord. e.g. degree 1 of C major -> Dm / Dm7 / Dm9. Null if the result
 * isn't a chord type the app knows (like iii's m7b9).
 */
export function diatonicChord(keyPc: number, steps: number[], degree: number, size: 3 | 4 | 5): SimpleChord | null {
    const stack = [0, 2, 4, 6, 8].slice(0, size);
    const pcs = stack.map((s) => (keyPc + steps[(degree + s) % 7]) % 12);
    const shape = shapeKey(pcs.map((pc) => pc - pcs[0] + 12));
    const quality = (Object.keys(QUALITIES) as Quality[]).find((q) => shapeKey(QUALITIES[q].intervals) === shape);
    return quality === undefined ? null : { root: rootAt(pcs[0]), quality };
}

const NUMERALS = ["I", "bII", "II", "bIII", "III", "IV", "#IV", "V", "bVI", "VI", "bVII", "VII"];

/** Roman numeral for any chord in a key, e.g. "vi7", "bVIImaj7", "iiø". */
export function romanNumeral(chord: SimpleChord, keyPc: number) {
    const interval = (pcOf(chord.root) - keyPc + 12) % 12;
    let numeral = NUMERALS[interval];
    if (isMinorish(chord.quality)) numeral = numeral.toLowerCase();

    const suffix: Partial<Record<Quality, string>> = {
        dim: "°", dim7: "°7", m7b5: "ø7", aug: "+", m: "", "": "",
        m7: "7", m9: "9", m6: "6", madd9: "add9", mMaj7: "(maj7)",
    };
    return numeral + (suffix[chord.quality] ?? chord.quality);
}

const MAJOR_FUNCTIONS = [
    "home (tonic)", "pre-dominant", "tonic color", "pre-dominant",
    "dominant", "relative minor", "leading-tone dominant",
];
const MINOR_FUNCTIONS = [
    "home (tonic)", "pre-dominant", "relative major", "pre-dominant",
    "dominant", "submediant", "subtonic",
];

/** "IV · pre-dominant" or "bVI · outside the key". */
export function chordRole(chord: SimpleChord, keyRoot: Root, scale: ScaleId) {
    const keyPc = pcOf(keyRoot);
    const steps = harmonySteps(scale);
    const degree = steps.indexOf((pcOf(chord.root) - keyPc + 12) % 12);
    const minorKey = steps[2] === 3;
    const fn = degree >= 0 ? (minorKey ? MINOR_FUNCTIONS : MAJOR_FUNCTIONS)[degree] : "outside the key";
    return `${romanNumeral(chord, keyPc)} · ${fn}`;
}

// ---------- idea generators ----------

type Idea = SimpleChord & {
    group: SuggestionGroup;
    role: string;
    reason: string;
    priority: number;
    order?: number; // fixed display order; otherwise sorted by score
};

function colorIdeas(current: SimpleChord, nextName: string | null): Idea[] {
    const r = pcOf(current.root);
    const R = current.root;
    const C = chordName(current);
    const ideas: Idea[] = [];
    const add = (quality: Quality, reason: string, priority: number) =>
        ideas.push({ root: R, quality, group: "color", role: `${R} with color`, reason, priority });

    if (isDimish(current.quality)) {
        add("m7b5", `Adds a flat 7th (${note(r + 10)}) to the diminished triad. Still unstable, but darker and jazzier than plain ${C}; the classic "ii" chord in minor keys.`, 0.6);
        add("dim7", `Stacks another minor 3rd (${note(r + 9)}) for a fully symmetrical chord. Maximum suspense, the sound of silent-film villains and dramatic movie cues.`, 0.55);
        return ideas;
    }

    if (isMinorish(current.quality)) {
        add("m7", `Adds the flat 7th (${note(r + 10)}). Softens the sadness of ${C} into something mellow and soulful; the backbone of R&B and lo-fi.`, 0.75);
        add("m9", `${R}m7 plus the 9th (${note(r + 2)}). Smooth, lush and a little sensual, the late-night neo-soul sound.`, 0.7);
        add("madd9", `Just the 9th (${note(r + 2)}) over minor, no 7th. Melancholy but open and airy; very common in modern pop ballads.`, 0.55);
        add("m6", `Minor with a major 6th (${note(r + 9)}). Bittersweet and a bit mysterious: film noir, bossa nova, the "James Bond" side of minor.`, 0.5);
        add("mMaj7", `Minor triad with a major 7th (${note(r + 11)}) a half step under the root. Tense and eerie, the classic spy/thriller chord.`, 0.35);
        add("sus2", `Swaps the minor 3rd for the 2nd (${note(r + 2)}). Removes the sadness and leaves something open and floating.`, 0.4);
        return ideas;
    }

    // major-ish (or sus)
    add("maj7", `Adds the major 7th (${note(r + 11)}), sitting just under the root. Same job as ${C}, but warmer and dreamier, with a wistful glow.`, 0.75);
    add("maj9", `${R}maj7 plus the 9th (${note(r + 2)}). Airy and polished, the sound of neo-soul, city pop and lo-fi.`, 0.7);
    add("add9", `Keeps ${C} and adds the 9th (${note(r + 2)}) for shimmer, without the jazzy 7th. A modern pop favorite.`, 0.6);
    add("6", `Adds the 6th (${note(r + 9)}). Sweet, settled and a little retro: Beatles-era pop and big-band endings.`, 0.45);
    add("sus4", `Swaps the 3rd for the 4th (${note(r + 5)}). Creates a "not finished yet" ache that wants to fall back to ${R}${nextName ? ` or move on to ${nextName}` : ""}.`, 0.5);
    add("sus2", `Swaps the 3rd for the 2nd (${note(r + 2)}). Neither happy nor sad: open, floating, ambient.`, 0.45);
    add("7", `Adds a flat 7th (${note(r + 10)}). Instantly bluesy and restless; it makes ${R} lean toward ${rootAt(r + 5)}.`, 0.4);
    return ideas;
}

function pullIdeas(next: SimpleChord): Idea[] {
    const n = pcOf(next.root);
    const N = chordName(next);
    const V = rootAt(n + 7);
    const nextMinor = isMinorish(next.quality) || isDimish(next.quality);
    const ideas: Idea[] = [];
    const add = (root: Root, quality: Quality, role: string, reason: string, priority: number) =>
        ideas.push({ root, quality, group: "pull", role, reason, priority });

    add(V, "7", `V7 of ${N}`,
        `${V}7 is the dominant of ${N}. Its 3rd (${note(n + 11)}) sits a half step below ${next.root} and its tritone wants to collapse inward, so the move into ${N} feels inevitable.`, 0.9);
    add(V, "9", `V9 of ${N}`,
        `Same pull as ${V}7, with the 9th (${note(n + 9)}) on top. Funkier and more confident; it glides into ${N} instead of shoving.`, 0.75);
    if (nextMinor) {
        add(V, "7b9", `V7♭9 of ${N}`,
            `A dominant with a flat 9th (${note(n + 8)}). The darkest, most dramatic way into a minor chord: flamenco, film scores, minor-key jazz.`, 0.75);
    } else {
        add(V, "13", `V13 of ${N}`,
            `A full jazz dominant with the 13th (${note(n + 4)}). Lush and sophisticated, but still resolving firmly into ${N}.`, 0.6);
    }
    add(V, "7sus4", `V7sus4 of ${N}`,
        `A softer dominant: the suspended 4th (${next.root}) hovers before ${N}, gospel-style, instead of pushing hard. Great for gentle builds.`, 0.65);
    add(rootAt(n + 2), nextMinor ? "m7b5" : "m7", `ii of ${N}`,
        `${rootAt(n + 2)}${nextMinor ? "m7♭5" : "m7"} is the "ii" of ${N}. Going ii to ${N} through its V is the most-used move in jazz and R&B; on its own it sets ${N} up smoothly.`, 0.6);
    add(rootAt(n - 1), "dim7", `Passing dim7 into ${N}`,
        `A diminished 7th a half step below ${next.root}. Every note leans by a half step into ${N}, a dramatic, cinematic lift.`, 0.6);
    add(rootAt(n + 1), "7", `Tritone sub of ${V}7`,
        `The tritone substitute: it shares ${V}7's tension notes, but its root slides down a half step into ${next.root}. Smooth, slinky, very jazz.`, 0.5);
    return ideas;
}

function swapIdeas(current: SimpleChord, keyPc: number, steps: number[]): Idea[] {
    const currentPcs = new Set(effectiveNotes(current).map((m) => m % 12));
    const C = chordName(current);
    const ideas: Idea[] = [];

    for (let degree = 0; degree < 7; degree++) {
        for (const sevenths of [false, true]) {
            const cand = diatonicChord(keyPc, steps, degree, sevenths ? 4 : 3);
            if (!cand) continue;
            if (cand.root === current.root) continue;
            const shared = [...new Set(effectiveNotes(cand).map((m) => m % 12))].filter((pc) => currentPcs.has(pc));
            if (shared.length < 2) continue;

            const vibe = VIBES[cand.quality].split(",")[0].toLowerCase();
            ideas.push({
                ...cand,
                group: "swap",
                role: `${romanNumeral(cand, keyPc)} in the key`,
                reason: `Shares ${shared.length} notes with ${C} (${shared.map(note).join(", ")}), so it can do the same job with a different mood: ${vibe} instead.`,
                priority: 0.4 + shared.length * 0.08 + (sevenths ? 0.03 : 0),
            });
        }
    }
    return ideas;
}

function borrowedIdeas(keyPc: number, steps: number[]): Idea[] {
    const K = rootAt(keyPc);
    const minorKey = steps[2] === 3;
    const ideas: Idea[] = [];
    const add = (pc: number, quality: Quality, role: string, reason: string, priority: number) =>
        ideas.push({ root: rootAt(keyPc + pc), quality, group: "borrowed", role, reason, priority });

    if (minorKey) {
        add(7, "7", "V7 (harmonic minor)",
            `In natural minor the v chord is weak. Raising its 3rd to ${note(keyPc + 11)} gives a real dominant with a much stronger pull home to ${K}m.`, 0.6);
        add(5, "", "IV (Dorian)",
            `A major IV in a minor key, borrowed from Dorian. A hopeful, soulful lift: think Santana, Daft Punk, "Get Lucky".`, 0.5);
        add(1, "maj7", "♭IImaj7 (Neapolitan)",
            `The Neapolitan chord, a half step above home. Exotic, dark and dramatic, with a Phrygian, Mediterranean flavor.`, 0.4);
    } else {
        add(5, "m6", "iv (borrowed minor)",
            `Borrowed from ${K} minor: making the IV minor gives a nostalgic, bittersweet sigh. A Beatles and Radiohead favorite, often right before home.`, 0.55);
        add(8, "maj7", "♭VImaj7",
            `Borrowed from ${K} minor. A big, cinematic, heroic lift from outside the key, the "epic movie trailer" chord.`, 0.5);
        add(10, "", "♭VII (Mixolydian)",
            `Borrowed ♭VII: the rock-anthem sound, triumphant and a little rebellious.`, 0.45);
    }
    return ideas;
}

// the diatonic 7th and 9th chords on every degree: the everyday harmony of
// R&B, jazz, neo-soul and lo-fi
const SEVENTH_BLURBS: Partial<Record<Quality, string>> = {
    maj7: "The major 7th adds a dreamy, wistful glow.",
    m7: "The flat 7th turns minor mellow and soulful instead of sad.",
    "7": "The key's only dominant 7th: its tritone pulls hard toward home.",
    m7b5: "Half-diminished: dark and searching, it leans toward the dominant.",
    maj9: "maj7 plus the 9th: airy, polished, neo-soul.",
    m9: "m7 plus the 9th: smooth, lush, late-night R&B.",
    "9": "A dominant with the 9th: funky, confident tension.",
};

function seventhIdeas(keyPc: number, steps: number[]): Idea[] {
    const minorKey = steps[2] === 3;
    const keyName = `${rootAt(keyPc)} ${minorKey ? "minor" : "major"}`;
    const ideas: Idea[] = [];

    for (let degree = 0; degree < 7; degree++) {
        const fn = (minorKey ? MINOR_FUNCTIONS : MAJOR_FUNCTIONS)[degree];
        ([4, 5] as const).forEach((size, i) => {
            const chord = diatonicChord(keyPc, steps, degree, size);
            if (!chord) return;
            const numeral = romanNumeral(chord, keyPc);
            ideas.push({
                ...chord,
                group: "sevenths",
                role: numeral,
                reason: `The ${numeral} of ${keyName}, its ${fn}. ${SEVENTH_BLURBS[chord.quality] ?? ""}`.trim(),
                priority: 0,
                order: degree * 2 + i, // keep them in scale order: I, ii, iii...
            });
        });
    }
    return ideas;
}

// every dominant chord worth knowing in this key: the key's own V (with its
// common flavors), a secondary dominant aimed at each diatonic chord, and the
// two classic substitutes. Each one points at a specific chord.
function dominantIdeas(keyPc: number, steps: number[], next: SimpleChord | null): Idea[] {
    const minorKey = steps[2] === 3;
    const tonic = diatonicChord(keyPc, steps, 0, 3)!;
    const tonicName = chordName(tonic);
    const V = rootAt(keyPc + 7);
    const nextName = next ? chordName(next) : null;
    const ideas: Idea[] = [];
    let order = 0;
    const add = (root: Root, quality: Quality, role: string, reason: string) =>
        ideas.push({ root, quality, group: "dominants", role, reason, priority: 0, order: order++ });

    // 1. the key's own dominant, in its usual flavors
    add(V, "7", "V7 · the key's dominant",
        `The home key's own dominant. Its tritone (${note(keyPc + 11)} and ${note(keyPc + 5)}) pulls hard back to ${tonicName}; the strongest resolution in music.`);
    add(V, "9", "V9",
        `${V}7 with the 9th (${note(keyPc + 9)}) on top: a smoother, funkier, more confident push home to ${tonicName}.`);
    add(V, minorKey ? "7b9" : "13", minorKey ? "V7♭9" : "V13",
        minorKey
            ? `${V}7 with a flat 9th (${note(keyPc + 8)}). Dark and dramatic, the classic way home to a minor tonic.`
            : `${V}7 with the 13th (${note(keyPc + 4)}). Lush big-band/jazz dominant, still resolving firmly to ${tonicName}.`);
    add(V, "7sus4", "V7sus4",
        `A suspended dominant: the 4th (${note(keyPc)}) hovers instead of the 3rd. Gospel-style anticipation before ${tonicName}.`);

    // 2. secondary dominants: the V7 of each other diatonic chord
    for (let degree = 1; degree < 7; degree++) {
        const target = diatonicChord(keyPc, steps, degree, 3);
        if (!target || target.quality === "dim") continue; // a diminished chord can't be "home"
        const targetPc = pcOf(target.root);
        const dom = rootAt(targetPc + 7);
        if (dom === V) continue; // that's just the key's own V7, listed above
        const targetName = chordName(target);
        const isNext = targetName === nextName;
        add(dom, "7", `V7 of ${targetName}${isNext ? " → next" : ""}`,
            `A secondary dominant: it borrows ${note(targetPc + 11)} (a half step under ${target.root}) to point straight at ${targetName}, the ${romanNumeral(target, keyPc)} chord.${isNext ? ` ${targetName} comes next, so it lands perfectly.` : ""}`);
    }

    // 3. substitutes
    add(rootAt(keyPc + 1), "7", "♭II7 · tritone sub",
        `The tritone substitute for ${V}7: same tension notes, but its root sits a half step above ${tonic.root} and slides down into ${tonicName}. Smooth and slinky.`);
    if (!minorKey) {
        add(rootAt(keyPc + 10), "7", "♭VII7 · backdoor",
            `The "backdoor" dominant. Borrowed from minor, it resolves to ${tonicName} up a whole step instead of down a fifth: softer and more soulful than ${V}7.`);
    }
    return ideas;
}

// ---------- ranking ----------

const QUOTA: Record<SuggestionGroup, number> = { color: 6, sevenths: 14, dominants: 14, pull: 5, swap: 4, borrowed: 3 };
const GROUP_ORDER: SuggestionGroup[] = ["color", "sevenths", "dominants", "pull", "swap", "borrowed"];

export function suggestChords(args: {
    current: SimpleChord;
    prev: SimpleChord | null;
    next: SimpleChord | null;
    keyRoot: Root;
    scale: ScaleId;
}): Suggestion[] {
    const { current, prev, next, keyRoot, scale } = args;
    const keyPc = pcOf(keyRoot);
    const steps = harmonySteps(scale);
    const keyPitches = scalePitchClasses(keyRoot, scale === "none" ? "major" : scale);
    const chosenKey = scalePitchClasses(keyRoot, scale);

    const ideas: Idea[] = [
        ...colorIdeas(current, next ? chordName(next) : null),
        ...seventhIdeas(keyPc, steps),
        ...dominantIdeas(keyPc, steps, next),
        ...(next && chordName(next) !== chordName(current) ? pullIdeas(next) : []),
        ...swapIdeas(current, keyPc, steps),
        ...borrowedIdeas(keyPc, steps),
    ];

    const asTension = (c: SimpleChord) => ({ notes: effectiveNotes(c), rootPc: pcOf(c.root) });

    // most groups skip the chord itself and its neighbors (that would just
    // repeat them); the 7ths & 9ths list is a full reference, so it only skips
    // the current chord. Duplicates are removed within a group, not across.
    const neighbors = new Set([current, prev, next].filter(Boolean).map((c) => chordName(c!)));
    const seen = new Set<string>();
    const scored: Suggestion[] = [];

    for (const idea of ideas) {
        const name = chordName(idea);
        const reference = idea.group === "sevenths" || idea.group === "dominants";
        const skip = reference ? name === chordName(current) : neighbors.has(name);
        if (skip || seen.has(`${idea.group}:${name}`)) continue;
        seen.add(`${idea.group}:${name}`);

        // color ideas are best described by their numeral in the key, e.g. "IVmaj7"
        if (idea.group === "color") idea.role = romanNumeral(idea, keyPc);

        const tensionIn = prev ? transitionTension(asTension(prev), asTension(idea), keyPitches).value : null;
        const tensionOut = next ? transitionTension(asTension(idea), asTension(next), keyPitches).value : null;

        // favor ideas that move smoothly from the previous chord
        const score = idea.priority - (tensionIn ?? 0.3) * 0.25;

        // which of its notes come from outside the chosen key
        const outsideKey = chosenKey
            ? [...new Set(effectiveNotes(idea).map((m) => m % 12))].filter((pc) => !chosenKey.has(pc)).map(note)
            : null;

        scored.push({
            root: idea.root,
            quality: idea.quality,
            name,
            group: idea.group,
            role: idea.role,
            vibe: VIBES[idea.quality],
            reason: idea.reason,
            tensionIn,
            tensionOut,
            outsideKey,
            score,
            order: idea.order ?? -score,
        });
    }

    // best first within each group (7ths & 9ths stay in scale order)
    scored.sort((a, b) => a.order - b.order);

    const used: Record<SuggestionGroup, number> = { color: 0, sevenths: 0, dominants: 0, pull: 0, swap: 0, borrowed: 0 };
    const kept = scored.filter((s) => used[s.group] < QUOTA[s.group] && ++used[s.group] > 0);

    return GROUP_ORDER.flatMap((g) => kept.filter((s) => s.group === g));
}

// ---------- basic chord picker ----------

// chord types offered in the quick picker, simplest first
const PICKER_QUALITIES: Quality[] = [
    "", "m", "dim", "aug",
    "7", "maj7", "m7", "m7b5", "dim7", "mMaj7",
    "6", "m6", "add9", "madd9",
    "9", "maj9", "m9", "13", "7b9",
    "sus2", "sus4", "7sus4",
];

/** Short button label for a chord type: "" -> "maj", "m" -> "min", "m7b5" -> "m7♭5". */
export function qualityLabel(quality: Quality) {
    if (quality === "") return "maj";
    if (quality === "m") return "min";
    return quality.replace("b5", "♭5").replace("b9", "♭9");
}

/** The notes of the key in scale order starting from the key root (all 12 with no scale). */
export function keyRoots(keyRoot: Root, scale: ScaleId): Root[] {
    const keyPc = pcOf(keyRoot);
    if (scale === "none") return ROOTS.map((_, i) => rootAt(keyPc + i));
    return SCALES[scale].intervals.map((i) => rootAt(keyPc + i));
}

/** The plain chord the key builds on this root (e.g. D in C major -> Dm), or null if it's not in the key. */
export function naturalChordOn(root: Root, keyRoot: Root, scale: ScaleId): SimpleChord | null {
    const keyPc = pcOf(keyRoot);
    const steps = harmonySteps(scale);
    const degree = steps.indexOf((pcOf(root) - keyPc + 12) % 12);
    return degree < 0 ? null : diatonicChord(keyPc, steps, degree, 3);
}

/**
 * Chord types for a root, split into the ones whose notes all sit in the key
 * ("natural") and the rest. With no scale picked, everything counts as natural.
 */
export function pickerQualities(root: Root, keyRoot: Root, scale: ScaleId) {
    const key = scalePitchClasses(keyRoot, scale);
    const natural: Quality[] = [];
    const other: Quality[] = [];

    for (const quality of PICKER_QUALITIES) {
        const fits = !key || effectiveNotes({ root, quality }).every((m) => key.has(m % 12));
        (fits ? natural : other).push(quality);
    }
    return { natural, other };
}

// ---------- progression names ----------

const DEGREE_NAMES = ["1", "♭2", "2", "♭3", "3", "4", "♯4", "5", "♭6", "6", "♭7", "7"];

/**
 * The scale-degree number of a chord's root in the key: "1", "4", "5"...
 * Notes outside the key get a ♭/♯ (e.g. "♭7" for B♭ in C major).
 */
export function scaleDegree(root: Root, keyRoot: Root, scale: ScaleId) {
    const interval = (pcOf(root) - pcOf(keyRoot) + 12) % 12;
    const degree = harmonySteps(scale).indexOf(interval);
    return degree >= 0 ? String(degree + 1) : DEGREE_NAMES[interval];
}

/**
 * Roman numeral of a chord in the chosen key, e.g. "IV", "vi7", "♭VIImaj7".
 * Chords on a note of the key are numbered by their place in that scale (so
 * in A minor, F is "VI", not "♭VI"); only notes outside the key get ♭/♯.
 */
export function numeralInKey(chord: SimpleChord, keyRoot: Root, scale: ScaleId = "major") {
    const keyPc = pcOf(keyRoot);
    const degree = harmonySteps(scale).indexOf((pcOf(chord.root) - keyPc + 12) % 12);
    const chromatic = romanNumeral(chord, keyPc).replace(/^b/, "♭").replace(/^#/, "♯");
    if (degree < 0) return chromatic;

    // swap the chromatic numeral (which may carry a ♭/♯) for the scale-degree one
    const base = ["I", "II", "III", "IV", "V", "VI", "VII"][degree];
    const suffix = chromatic.replace(/^[♭♯]?[IViv]+/, "");
    const minorish = /^[♭♯]?[iv]/.test(chromatic);
    return (minorish ? base.toLowerCase() : base) + suffix;
}
