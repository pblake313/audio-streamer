// How tense a move from one chord to the next feels, from 0 (smooth,
// resolving) to 1 (very tense). It blends five things listeners hear:
// root movement, how far the voices travel, shared notes, clashing
// intervals in the new chord, and notes outside the key.

const WEIGHTS = {
    rootMotion: 0.3,
    voiceLeading: 0.25,
    commonTones: 0.2,
    dissonance: 0.15,
    outOfKey: 0.1,
};

// tension of the root moving up by N semitones
// (5 = up a 4th / down a 5th, the classic V -> I resolution)
const ROOT_MOTION = [0.1, 0.75, 0.4, 0.3, 0.3, 0.05, 1, 0.35, 0.3, 0.3, 0.4, 0.35];

export type Tension = {
    value: number; // 0..1
    label: "Smooth" | "Moderate" | "Strong" | "Very tense";
    reasons: string[];
};

const pitchClasses = (notes: number[]) => new Set(notes.map((n) => n % 12));

/** Tritones count most, then half-step rubs (minor 2nds / major 7ths). */
function dissonance(notes: number[]) {
    const pcs = [...pitchClasses(notes)];
    let value = 0;
    for (let i = 0; i < pcs.length; i++) {
        for (let j = i + 1; j < pcs.length; j++) {
            const interval = Math.min((pcs[i] - pcs[j] + 12) % 12, (pcs[j] - pcs[i] + 12) % 12);
            if (interval === 6) value += 0.35;
            if (interval === 1) value += 0.25;
        }
    }
    return Math.min(1, value);
}

/**
 * Average distance (semitones) from each new pitch to the nearest old one,
 * ignoring octaves: voices are free to move by the shortest path, so a bass
 * jumping G -> C doesn't count as a big leap.
 */
function voiceLeading(from: number[], to: number[]) {
    const fromPcs = [...pitchClasses(from)];
    const toPcs = [...pitchClasses(to)];
    const total = toPcs.reduce((sum, pc) => {
        const nearest = Math.min(
            ...fromPcs.map((f) => {
                const d = Math.abs(f - pc) % 12;
                return Math.min(d, 12 - d);
            }),
        );
        return sum + nearest;
    }, 0);
    return total / toPcs.length;
}

export function transitionTension(
    from: { notes: number[]; rootPc: number },
    to: { notes: number[]; rootPc: number },
    keyPitches: Set<number> | null,
): Tension {
    const reasons: string[] = [];

    const motion = ROOT_MOTION[(to.rootPc - from.rootPc + 12) % 12];
    if (motion <= 0.1) reasons.push(motion === 0.05 ? "resolves down a fifth" : "same root");
    if (motion >= 0.75) reasons.push(motion === 1 ? "tritone root jump" : "half-step root jump");

    const travel = voiceLeading(from.notes, to.notes);
    const voices = Math.min(1, travel / 3);
    if (travel <= 0.75) reasons.push("voices barely move");
    if (travel >= 2) reasons.push("voices leap");

    const fromPcs = pitchClasses(from.notes);
    const toPcs = pitchClasses(to.notes);
    const shared = [...toPcs].filter((pc) => fromPcs.has(pc)).length;
    const common = 1 - shared / toPcs.size;
    if (shared >= 2) reasons.push(`${shared} shared notes`);
    if (shared === 0) reasons.push("no shared notes");

    const clash = dissonance(to.notes);
    if (clash >= 0.35) reasons.push("dissonant chord");

    const outside = keyPitches ? [...toPcs].filter((pc) => !keyPitches.has(pc)).length : 0;
    const outOfKey = keyPitches ? outside / toPcs.size : 0;
    if (outside) reasons.push(`${outside} note${outside === 1 ? "" : "s"} outside the key`);

    const value = Math.min(
        1,
        motion * WEIGHTS.rootMotion +
            voices * WEIGHTS.voiceLeading +
            common * WEIGHTS.commonTones +
            clash * WEIGHTS.dissonance +
            outOfKey * WEIGHTS.outOfKey,
    );

    const label =
        value < 0.3 ? "Smooth" : value < 0.5 ? "Moderate" : value < 0.7 ? "Strong" : "Very tense";

    return { value, label, reasons };
}

// real progressions mostly score 0.15-0.75, so stretch that span across the
// whole green -> red range
const COLOR_LOW = 0.15;
const COLOR_HIGH = 0.7;

/** 0..1 after stretching and an S-curve that pushes values toward the ends. */
export function tensionIntensity(value: number) {
    const t = Math.max(0, Math.min(1, (value - COLOR_LOW) / (COLOR_HIGH - COLOR_LOW)));
    return t * t * (3 - 2 * t); // smoothstep
}

/** Vivid green (smooth) -> yellow -> orange -> hot red (very tense). */
export function tensionColor(value: number) {
    const t = tensionIntensity(value);
    const hue = Math.round(135 * (1 - t));
    return `hsl(${hue}, 95%, ${52 + Math.round(t * 4)}%)`;
}
