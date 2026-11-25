// Names any set of notes as a chord symbol: triads, 6ths, 7ths, extensions
// (9/11/13), alterations (b5 #5 b9 #9 #11 b13), add/sus chords, power
// chords and slash chords.
//
// Every note is tried as the root; each reading is scored by how plain and
// conventional its name is (root in the bass, few alterations, every note
// accounted for) and the lowest score wins.

const NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

// scoring weights: lower total = better name
const ROOT_IN_BASS = -2;
const PER_ALTERATION = 2.5;
const PER_ADD = 2;
const SUS = 2;
const NO_THIRD = 2;
const MISSING_FIFTH = 1;
const ALTERED_FIFTH = 1;
const UNEXPLAINED_NOTE = 5; // a name that ignores a note is a bad name
// bigger chord numbers are harder to read, so a plain reading should beat them
const EXTENSION_COST: Record<string, number> = { "9": 0.5, "11": 1, "13": 1.5, "6": 0.5, "6/9": 1 };
const MINOR_MAJOR = 1;
const THIRTEEN_WITHOUT_NINE = 1;

type Reading = { name: string; score: number };

function readFromRoot(rootPc: number, pcs: Set<number>, bassPc: number): Reading {
    const has = (interval: number) => pcs.has((rootPc + interval) % 12);

    // intervals this reading's name accounts for
    const explained = new Set<number>([0]);
    const use = (interval: number, condition: boolean) => {
        if (condition) explained.add(interval);
        return condition;
    };

    const alterations: string[] = [];
    const adds: string[] = [];

    // ---------- third ----------
    let third: "major" | "minor" | "sus4" | "sus2" | "none";
    if (use(4, has(4))) third = "major";
    else if (use(3, has(3))) third = "minor";
    else if (use(5, has(5))) third = "sus4";
    else if (use(2, has(2))) third = "sus2";
    else third = "none";
    const minor = third === "minor";

    // ---------- seventh ----------
    const b7 = use(10, has(10));
    const maj7 = use(11, has(11));
    const hasSeventh = b7 || maj7;

    // ---------- fifth ----------
    const perfect5 = use(7, has(7));
    let fifth: "perfect" | "flat" | "sharp" | "none" = perfect5 ? "perfect" : "none";
    if (!perfect5 && third !== "none" && use(6, has(6))) fifth = "flat";
    else if (!perfect5 && third === "major" && use(8, has(8))) fifth = "sharp";

    // dim7: dim triad + bb7 (spelled like a 6th) and no other 7th
    const dim7 = minor && fifth === "flat" && !hasSeventh && use(9, has(9));

    // ---------- extensions & alterations ----------
    const ninth = third !== "sus2" && use(2, has(2));
    const flat9 = use(1, has(1));
    const sharp9 = third === "major" && use(3, has(3));
    const eleventh = third !== "sus4" && third !== "none" && use(5, has(5));
    const sharp11 = perfect5 && use(6, has(6));
    const flat13 = fifth !== "sharp" && use(8, has(8));
    const thirteenth = !dim7 && use(9, has(9));

    // ---------- build the name ----------
    if (third === "none" && !hasSeventh && perfect5 && pcs.size === 2) {
        return { name: "5", score: rootPc === bassPc ? ROOT_IN_BASS : 0 }; // power chord
    }

    let name: string;
    let ninthInName = false;
    let eleventhInName = false;
    let thirteenthInName = false;
    let complexity = 0; // cost of the chord number itself (9, 13, 6/9...)

    if (dim7) {
        name = "dim7";
    } else if (minor && fifth === "flat" && b7) {
        name = "m7b5";
    } else if (minor && fifth === "flat" && !hasSeventh) {
        name = "dim";
    } else {
        // highest stacked extension when there's a 7th: 13 > 11 > 9 > 7
        let ext = "7";
        if (hasSeventh) {
            if (thirteenth) {
                ext = "13";
                thirteenthInName = true;
                ninthInName = ninth;
                eleventhInName = eleventh && ninth;
            } else if (eleventh && ninth) {
                ext = "11";
                ninthInName = eleventhInName = true;
            } else if (ninth) {
                ext = "9";
                ninthInName = true;
            }
        }

        complexity += EXTENSION_COST[ext] ?? 0;
        if (ext === "13" && !ninth) complexity += THIRTEEN_WITHOUT_NINE;
        if (maj7 && minor) complexity += MINOR_MAJOR;

        if (hasSeventh) {
            if (maj7 && minor) name = `mMaj${ext}`;
            else if (maj7) name = `maj${ext}`;
            else if (minor) name = `m${ext}`;
            else name = ext;
        } else {
            name = minor ? "m" : "";
            if (thirteenth) {
                // no 7th: the 13 is a 6th
                name += ninth ? "6/9" : "6";
                complexity += EXTENSION_COST[ninth ? "6/9" : "6"];
                thirteenthInName = true;
                ninthInName = ninth;
            }
        }

        if (fifth === "sharp") {
            if (hasSeventh) alterations.push("#5");
            else name += "aug";
        }
        if (fifth === "flat") alterations.push("b5");
    }

    if (third === "sus4") name += "sus4";
    if (third === "sus2") name += "sus2";

    // natural extensions the main symbol didn't absorb
    if (ninth && !ninthInName) adds.push("9");
    if (eleventh && !eleventhInName) adds.push("11");
    if (thirteenth && !thirteenthInName) adds.push("13");

    if (flat9) alterations.push("b9");
    if (sharp9) alterations.push("#9");
    if (sharp11) alterations.push("#11");
    if (flat13) alterations.push(hasSeventh ? "b13" : "b6");

    if (adds.length) name += adds.map((a) => `add${a}`).join("");
    if (alterations.length) name += `(${alterations.join(",")})`;
    if (third === "none") name += "(no3)";

    // ---------- score ----------
    let score = rootPc === bassPc ? ROOT_IN_BASS : 0;
    score += alterations.length * PER_ALTERATION;
    score += adds.length * PER_ADD;
    if (third === "sus4" || third === "sus2") score += SUS;
    if (third === "none") score += NO_THIRD;
    if (fifth === "none" && !dim7) score += MISSING_FIFTH;
    if (fifth === "sharp" || (fifth === "flat" && !minor)) score += ALTERED_FIFTH;

    score += complexity;

    for (const pc of pcs) {
        if (!explained.has((pc - rootPc + 12) % 12)) score += UNEXPLAINED_NOTE;
    }

    return { name, score };
}

/** e.g. [43, 55, 58, 62, 65] -> "Gm7", [40, 48, 52, 55] -> "C/E". */
export function nameChord(notes: number[]): string {
    if (!notes.length) return "";

    const sorted = [...notes].sort((a, b) => a - b);
    const bassPc = sorted[0] % 12;
    const pcs = new Set(sorted.map((n) => n % 12));

    if (pcs.size === 1) return NAMES[bassPc];

    let best: { rootPc: number; reading: Reading } | null = null;

    // bass note first, so it wins ties
    for (const rootPc of [bassPc, ...[...pcs].filter((pc) => pc !== bassPc)]) {
        const reading = readFromRoot(rootPc, pcs, bassPc);
        if (!best || reading.score < best.reading.score) best = { rootPc, reading };
    }

    const { rootPc, reading } = best!;
    const slash = rootPc === bassPc ? "" : `/${NAMES[bassPc]}`;

    return `${NAMES[rootPc]}${reading.name}${slash}`;
}
