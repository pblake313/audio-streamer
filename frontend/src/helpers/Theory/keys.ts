// Key theory for the circle of fifths: correctly spelled scales, key
// signatures, diatonic chords and related keys.


export type Mode = "major" | "minor";
// only matters at the bottom of the circle (F#/Gb), where both spellings are real keys
export type Spelling = "sharp" | "flat";
export type KeyRef = { pos: number; mode: Mode; spelling: Spelling };

/** Position 6 on the circle is the one key written with either 6 sharps or 6 flats. */
export const ENHARMONIC_POS = 6;

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11];

// tonics clockwise from the top; position 6 is filled in by spelling
const MAJOR_TONICS = ["C", "G", "D", "A", "E", "B", "", "Db", "Ab", "Eb", "Bb", "F"];
const MINOR_TONICS = ["A", "E", "B", "F#", "C#", "G#", "", "Bb", "F", "C", "G", "D"];
const POS6 = { major: { sharp: "F#", flat: "Gb" }, minor: { sharp: "D#", flat: "Eb" } };

// other spellings worth knowing about (7 sharps / 7 flats)
const ENHARMONIC_NOTES: Record<number, Record<Mode, string>> = {
    5: { major: "Cb major (7 flats)", minor: "Ab minor (7 flats)" },
    7: { major: "C# major (7 sharps)", minor: "A# minor (7 sharps)" },
};

const SHARP_ORDER = ["F#", "C#", "G#", "D#", "A#", "E#", "B#"];
const FLAT_ORDER = ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"];

const STEPS: Record<Mode, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10], // natural minor
};

const DEGREE_NAMES: Record<Mode, string[]> = {
    major: ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading tone"],
    minor: ["Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Subtonic"],
};

const FUNCTIONS: Record<Mode, ChordFunction[]> = {
    major: ["Tonic", "Predominant", "Tonic", "Predominant", "Dominant", "Tonic", "Dominant"],
    minor: ["Tonic", "Predominant", "Tonic", "Predominant", "Dominant", "Predominant", "Dominant"],
};

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

/** "F#" -> "F♯", "Bb" -> "B♭" (letters are uppercase, so a lowercase b is always a flat). */
export const pretty = (name: string) => name.replace(/#/g, "♯").replace(/b/g, "♭");

const mod12 = (n: number) => ((n % 12) + 12) % 12;
const wrapPos = (n: number) => ((n % 12) + 12) % 12;

function parseNote(name: string) {
    const letter = LETTERS.indexOf(name[0]);
    let acc = 0;
    for (const ch of name.slice(1)) acc += ch === "#" ? 1 : -1;
    return { letter, pc: mod12(NATURAL_PC[letter] + acc) };
}

/** Spells pitch class `pc` using `letter` (e.g. pc 6 on F -> "F#", on G -> "Gb"). */
function spell(letter: number, pc: number) {
    const diff = mod12(pc - NATURAL_PC[letter] + 6) - 6; // -6..5
    return LETTERS[letter] + (diff > 0 ? "#".repeat(diff) : "b".repeat(-diff));
}

export function tonicOf(key: KeyRef) {
    if (key.pos === ENHARMONIC_POS) return POS6[key.mode][key.spelling];
    return (key.mode === "major" ? MAJOR_TONICS : MINOR_TONICS)[key.pos];
}

export const keyName = (key: KeyRef) => `${pretty(tonicOf(key))} ${key.mode}`;

/** Short label for a circle segment: "C", "Am", "F♯/G♭", ... */
export function segmentLabel(pos: number, mode: Mode) {
    const suffix = mode === "minor" ? "m" : "";
    if (pos === ENHARMONIC_POS) {
        const { sharp, flat } = POS6[mode];
        return `${pretty(sharp)}${suffix}/${pretty(flat)}${suffix}`;
    }
    return pretty((mode === "major" ? MAJOR_TONICS : MINOR_TONICS)[pos]) + suffix;
}

export function signatureOf(key: KeyRef) {
    const sharps = key.pos === ENHARMONIC_POS ? key.spelling === "sharp" : key.pos < ENHARMONIC_POS;
    const count = key.pos === 0 ? 0 : sharps ? key.pos : 12 - key.pos;
    const type: "sharp" | "flat" | "none" = count === 0 ? "none" : sharps ? "sharp" : "flat";
    const accidentals = (sharps ? SHARP_ORDER : FLAT_ORDER).slice(0, count);
    return { count, type, accidentals };
}

/** Short signature label for the circle, e.g. "3♭". */
export function signatureLabel(pos: number) {
    if (pos === 0) return "—";
    if (pos === ENHARMONIC_POS) return "6♯/6♭";
    return pos < ENHARMONIC_POS ? `${pos}♯` : `${12 - pos}♭`;
}

// interval names by semitones above the tonic
export const INTERVAL_NAMES = [
    "Root", "Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Tritone",
    "Perfect 5th", "Minor 6th", "Major 6th", "Minor 7th", "Major 7th", "Octave",
];

export function scaleOf(key: KeyRef) {
    const tonic = parseNote(tonicOf(key));
    return STEPS[key.mode].map((step, i) => {
        const letter = (tonic.letter + i) % 7;
        const pc = mod12(tonic.pc + step);
        return {
            degree: i + 1,
            name: spell(letter, pc),
            pc,
            letter,
            role: DEGREE_NAMES[key.mode][i],
            interval: INTERVAL_NAMES[step],
        };
    });
}

/**
 * Camelot wheel code DJs use for harmonic mixing: C major is 8B, A minor 8A.
 * One step clockwise on the circle is +1, and relative keys share a number.
 */
export const camelotOf = (key: KeyRef) => `${((key.pos + 7) % 12) + 1}${key.mode === "major" ? "B" : "A"}`;

/** Whole and half steps between neighbouring scale notes, the last one back up to the tonic. */
export function stepsOf(key: KeyRef) {
    const pcs = scaleOf(key).map((note) => note.pc);
    return pcs.map((pc, i) => {
        const semis = mod12(pcs[(i + 1) % 7] - pc);
        return { semis, label: semis === 1 ? "H" : semis === 2 ? "W" : "W+H" };
    });
}

// chord types offered for every degree, as scale steps above the chord's root
export const CHORD_KINDS = [
    { id: "triad", label: "Triads", steps: [0, 2, 4] },
    { id: "7", label: "7ths", steps: [0, 2, 4, 6] },
    { id: "9", label: "9ths", steps: [0, 2, 4, 6, 8] },
    { id: "11", label: "11ths", steps: [0, 2, 4, 6, 8, 10] },
    { id: "13", label: "13ths", steps: [0, 2, 4, 6, 8, 10, 12] },
    { id: "6", label: "6ths", steps: [0, 2, 4, 5] },
    { id: "add9", label: "add9", steps: [0, 2, 4, 8] },
    { id: "sus2", label: "sus2", steps: [0, 1, 4] },
    { id: "sus4", label: "sus4", steps: [0, 3, 4] },
] as const;

export type ChordKind = (typeof CHORD_KINDS)[number]["id"];
export type ChordFunction = "Tonic" | "Predominant" | "Dominant";

export type KeyChord = {
    roman: string;
    name: string; // e.g. "F♯m9"
    tones: string[]; // spelled chord tones, low to high
    midi: number[]; // bass + voicing, for playback
    // every tone stacked up from the chord's root, the root sitting on its
    // scale degree above the tonic, for drawing the chords as a piano roll
    stack: { midi: number; name: string }[];
    func: ChordFunction;
};

type Tone = { name: string; pc: number; letter: number };

const acc = (diff: number) => (diff < 0 ? "♭" : diff > 0 ? "♯" : "");

// the natural size of each extension above the root, in semitones
const EXTENSIONS = [
    { n: 9, natural: 2 },
    { n: 11, natural: 5 },
    { n: 13, natural: 9 },
];

/** The symbol after the root letter, e.g. "m7♭5", "maj9♯11", "sus4". */
function chordSuffix(kind: ChordKind, iv: number[]) {
    if (kind === "sus2" || kind === "sus4") {
        const natural = kind === "sus2" ? 2 : 5;
        return `sus${acc(iv[1] - natural)}${kind === "sus2" ? 2 : 4}${iv[2] === 6 ? "♭5" : ""}`;
    }

    const [, third, fifth] = iv;
    const triad =
        third === 4 && fifth === 7 ? "maj" : third === 3 && fifth === 7 ? "min" : third === 3 ? "dim" : "aug";
    const triadSymbol = { maj: "", min: "m", dim: "°", aug: "+" }[triad];

    if (kind === "triad") return triadSymbol;
    if (kind === "6") return `${triadSymbol}${acc(iv[3] - 9)}6`;
    if (kind === "add9") {
        const add = `add${acc(iv[3] - 2)}9`;
        return triad === "maj" ? add : `${triadSymbol}(${add})`;
    }

    // seventh chords and up: the 7th decides the family
    const seventh = iv[3];
    let stem = "";
    let tail = "";
    if (triad === "maj") stem = seventh === 11 ? "maj" : "";
    else if (triad === "min") [stem, tail] = seventh === 10 ? ["m", ""] : ["m(maj", ")"];
    else if (triad === "dim") [stem, tail] = seventh === 10 ? ["m", "♭5"] : ["°", ""];
    else [stem, tail] = ["maj", "♯5"];

    // the highest unaltered extension names the chord (maj13, m11...), altered ones are added on
    const exts = iv.slice(4).map((semis, i) => ({ ...EXTENSIONS[i], diff: semis - EXTENSIONS[i].natural }));
    const top = [...exts].reverse().find((ext) => ext.diff === 0);
    const altered = exts.filter((ext) => ext.diff !== 0).map((ext) => acc(ext.diff) + ext.n);
    return `${stem}${top ? top.n : 7}${tail}${altered.join("")}`;
}

/** Builds the chord on `degree` of a 7-note scale by stacking the given scale steps. */
function chordFromScale(scale: Tone[], degree: number, kind: ChordKind, func: ChordFunction): KeyChord {
    const steps = CHORD_KINDS.find((k) => k.id === kind)!.steps;
    const tones = steps.map((step) => scale[(degree + step) % 7]);
    const root = tones[0];
    const iv = tones.map((tone) => mod12(tone.pc - root.pc));
    const suffix = chordSuffix(kind, iv);

    // lowercase numerals already say "minor", so the m drops out; half-diminished gets ø
    const minor = kind !== "sus2" && kind !== "sus4" && iv[1] === 3;
    const numeral = minor ? NUMERALS[degree].toLowerCase() : NUMERALS[degree];
    const romanSuffix = minor ? suffix.replace(/^m(\d+)♭5/, "ø$1").replace(/^m/, "") : suffix;

    // root in the bass, the rest stacked upward from around E3; big chords leave
    // the root out of the upper voicing so they don't get muddy
    const upper = tones.length >= 5 ? tones.slice(1) : tones;
    const midi = [36 + root.pc];
    let prev = 51;
    for (const tone of upper) {
        let note = prev + 1;
        while (mod12(note) !== tone.pc) note++;
        midi.push(note);
        prev = note;
    }

    const tonicPc = scale[0].pc;
    const stack: KeyChord["stack"] = [];
    let below = 47 + tonicPc + mod12(root.pc - tonicPc); // the root lands one above this
    for (const tone of tones) {
        let note = below + 1;
        while (mod12(note) !== tone.pc) note++;
        stack.push({ midi: note, name: pretty(tone.name) });
        below = note;
    }

    return {
        roman: numeral + romanSuffix,
        name: pretty(root.name) + suffix,
        tones: tones.map((tone) => pretty(tone.name)),
        midi,
        stack,
        func,
    };
}

export function diatonicChords(key: KeyRef, kind: ChordKind): KeyChord[] {
    const scale = scaleOf(key);
    return scale.map((_, i) => chordFromScale(scale, i, kind, FUNCTIONS[key.mode][i]));
}

function harmonicMinorScale(key: KeyRef): Tone[] {
    const scale = scaleOf(key);
    const lead = scale[6];
    const pc = mod12(lead.pc + 1);
    return [...scale.slice(0, 6), { ...lead, pc, name: spell(lead.letter, pc) }];
}

/** Minor keys borrow V (with a raised 7th) from harmonic minor to get a strong pull home. */
export function harmonicDominant(key: KeyRef, kind: ChordKind): KeyChord {
    return chordFromScale(harmonicMinorScale(key), 4, kind, "Dominant");
}

/** The raised 7th in a minor key, e.g. G♯ in A minor. */
export function leadingTone(key: KeyRef) {
    return pretty(harmonicMinorScale(key)[6].name);
}

// a progression step is a scale degree index, or "H" for the harmonic-minor V
type Step = number | "H";
// every progression is 4 bars; a bar holds one chord, or two for half a bar each
type Bar = Step | [Step, Step];
type ProgressionDef = { name: string; about: string; bars: [Bar, Bar, Bar, Bar]; kind?: ChordKind };

const PROGRESSIONS: Record<Mode, ProgressionDef[]> = {
    major: [
        {
            name: "Pop anthem",
            about: "The four chords behind countless radio hits.",
            bars: [0, 4, 5, 3],
        },
        {
            name: "Sad pop",
            about: "Same four chords, starting on vi for a bittersweet feel.",
            bars: [5, 3, 0, 4],
        },
        {
            name: "Three-chord rock",
            about: "Rock, punk and folk built on just I, IV and V.",
            bars: [0, 3, 4, 3],
        },
        {
            name: "Doo-wop",
            about: "The '50s ballad loop, still all over soul and pop.",
            bars: [0, 5, 3, 4],
        },
        {
            name: "Jazz ii–V–I",
            about: "The cadence at the heart of jazz standards.",
            bars: [1, 4, 0, 0],
            kind: "7",
        },
        {
            name: "Royal road",
            about: "The J-pop and anime favorite: IV, V, iii, vi.",
            bars: [3, 4, 2, 5],
            kind: "7",
        },
        {
            name: "Neo-soul",
            about: "Lush 9th chords drifting between IV, I, vi and ii.",
            bars: [3, 0, 5, 1],
            kind: "9",
        },
        {
            name: "Canon",
            about: "Pachelbel's descending bass line, two chords a bar.",
            bars: [
                [0, 4],
                [5, 2],
                [3, 0],
                [3, 4],
            ],
        },
    ],
    minor: [
        {
            name: "Epic",
            about: "Big, cinematic, used in film scores and anthems.",
            bars: [0, 5, 2, 6],
        },
        {
            name: "Andalusian cadence",
            about: "Stepping down to a major V. Flamenco, surf rock, drama.",
            bars: [0, 6, 5, "H"],
        },
        {
            name: "Minor blues",
            about: "i, iv and a strong major V, resolving home.",
            bars: [0, 3, "H", 0],
        },
        {
            name: "Hip-hop loop",
            about: "A dark, looping minor groove.",
            bars: [0, 5, 6, 0],
        },
        {
            name: "Minor ii–V–i",
            about: "Jazz's cadence in minor, with a half-diminished ii.",
            bars: [1, "H", 0, 0],
            kind: "7",
        },
        {
            name: "Lo-fi",
            about: "Mellow minor 9ths for late-night beats.",
            bars: [0, 3, 5, 6],
            kind: "9",
        },
        {
            name: "Tension build",
            about: "Climbs through iv and VI to a major V that begs to resolve.",
            bars: [0, 3, 5, "H"],
        },
        {
            name: "Drift",
            about: "Wanders through iv, VI and v without ever settling.",
            bars: [0, [3, 5], 4, [5, 6]],
        },
    ],
};

export type ProgressionChord = KeyChord & { index: number; half: boolean };

export function progressionsFor(key: KeyRef) {
    return PROGRESSIONS[key.mode].map((def) => {
        const kind = def.kind ?? "triad";
        const chords = diatonicChords(key, kind);
        const dominant = key.mode === "minor" ? harmonicDominant(key, kind) : null;
        const chordAt = (step: Step) => (step === "H" ? dominant! : chords[step]);

        // number every chord in playing order, so playback can light them up
        let index = 0;
        const bars: ProgressionChord[][] = def.bars.map((bar) => {
            const steps = Array.isArray(bar) ? bar : [bar];
            return steps.map((step) => ({ ...chordAt(step), index: index++, half: steps.length === 2 }));
        });

        return {
            name: def.name,
            about: def.about,
            kindLabel: CHORD_KINDS.find((k) => k.id === kind)!.label,
            bars,
            chords: bars.flat(),
        };
    });
}

/** Each spot on the circle gets its own hue, so the circle reads as a color wheel. */
export const keyHue = (pos: number) => (wrapPos(pos) * 30 + 350) % 360;


/** Moves to another key on the circle, keeping a sensible spelling for F♯/G♭. */
export function keyAt(from: KeyRef, pos: number, mode: Mode): KeyRef {
    pos = wrapPos(pos);
    let spelling: Spelling = from.spelling;
    if (pos === ENHARMONIC_POS && from.pos !== ENHARMONIC_POS) {
        // arriving from the sharp side of the circle keeps sharps, and vice versa
        spelling = from.pos < ENHARMONIC_POS ? "sharp" : "flat";
    }
    return { pos, mode, spelling };
}

export function relatedKeys(key: KeyRef) {
    const other: Mode = key.mode === "major" ? "minor" : "major";
    return {
        relative: keyAt(key, key.pos, other),
        // a key's parallel sits three steps round: C major (0) <-> C minor (9)
        parallel: keyAt(key, key.mode === "major" ? key.pos + 9 : key.pos + 3, other),
        dominant: keyAt(key, key.pos + 1, key.mode),
        subdominant: keyAt(key, key.pos - 1, key.mode),
    };
}

export function enharmonicOf(key: KeyRef): string | null {
    if (key.pos === ENHARMONIC_POS) {
        const other: Spelling = key.spelling === "sharp" ? "flat" : "sharp";
        return `${keyName({ ...key, spelling: other })} (6 ${other}s)`;
    }
    const note = ENHARMONIC_NOTES[key.pos]?.[key.mode];
    return note ? pretty(note) : null;
}

// ---------------------------------------------------------------------------
// keys in URLs: /theory/d-minor, /theory/f-sharp-major, /theory/b-flat-minor, ...

/** URL-friendly name for a key, e.g. "d-minor", "f-sharp-major", "b-flat-minor". */
export function keySlug(key: KeyRef) {
    const tonic = tonicOf(key);
    const accidental = tonic.slice(1).replace(/#/g, "-sharp").replace(/b/g, "-flat");
    return `${tonic[0].toLowerCase()}${accidental}-${key.mode}`;
}

/**
 * Reads a key from loose text: "d-minor", "Dm", "D minor", "F#m", "f-sharp",
 * "Bb", "b♭m", "Eb major"... Any spelling of a pitch works (C# major lands on
 * Db major, its place on the circle). Returns null when it isn't a key.
 */
export function parseKey(text: string | null | undefined): KeyRef | null {
    if (!text) return null;
    const clean = text
        .toLowerCase()
        .replace(/sharp|♯/g, "#")
        .replace(/flat|♭/g, "b")
        .replace(/[\s_-]+/g, "");
    const match = clean.match(/^([a-g])(#|b)?(m|min|minor|maj|major)?$/);
    if (!match) return null;

    const [, letterText, accidental = "", modeText = ""] = match;
    const mode: Mode = modeText.startsWith("m") && !modeText.startsWith("maj") ? "minor" : "major";
    const { pc } = parseNote(letterText.toUpperCase() + accidental);

    const tonics = mode === "major" ? MAJOR_TONICS : MINOR_TONICS;
    let pos = tonics.findIndex((name) => name && parseNote(name).pc === pc);
    if (pos === -1) pos = ENHARMONIC_POS; // F#/Gb major, D#/Eb minor
    const spelling: Spelling = pos === ENHARMONIC_POS && accidental === "#" ? "sharp" : "flat";
    return { pos, mode, spelling };
}
