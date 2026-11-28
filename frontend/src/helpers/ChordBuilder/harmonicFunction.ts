// What job a chord does in the current key: tonic (home), predominant (moving
// away), dominant (tension that wants to resolve home), or something from
// outside the key.

export type HarmonicFunction = "Tonic" | "Predominant" | "Dominant" | "Secondary dominant" | "Borrowed";

const mod12 = (n: number) => ((n % 12) + 12) % 12;

// by the chord root's distance in semitones above the key's root. Covers every
// scale the builder offers: I / i, ♭II, ii, ♭III, iii, IV / iv, ♯IV, V / v,
// ♭VI, vi, ♭VII, vii°
const BY_DEGREE: HarmonicFunction[] = [
    "Tonic", // 0  I
    "Predominant", // 1  ♭II (Neapolitan, phrygian)
    "Predominant", // 2  ii
    "Tonic", // 3  ♭III (relative major in minor)
    "Tonic", // 4  iii
    "Predominant", // 5  IV
    "Predominant", // 6  ♯IV (lydian)
    "Dominant", // 7  V
    "Predominant", // 8  ♭VI
    "Tonic", // 9  vi
    "Dominant", // 10 ♭VII (subtonic)
    "Dominant", // 11 vii°
];

/** Hue for each function, matching the colors on the Theory page. */
export const FUNCTION_HUES: Record<HarmonicFunction, number> = {
    Tonic: 160,
    Predominant: 42,
    Dominant: 350,
    "Secondary dominant": 18,
    Borrowed: 270,
};

/**
 * @param chordPcs pitch classes the chord plays
 * @param rootPc the chord's root
 * @param keyRootPc the key's root
 * @param scalePcs pitch classes in the key's scale, or null for no key
 */
export function harmonicFunction(
    chordPcs: number[],
    rootPc: number,
    keyRootPc: number,
    scalePcs: Set<number> | null,
): HarmonicFunction | null {
    if (!scalePcs || scalePcs.size === 0) return null;

    const degree = mod12(rootPc - keyRootPc);
    const fitsKey = scalePcs.has(rootPc) && chordPcs.every((pc) => scalePcs.has(pc));
    if (fitsKey) return BY_DEGREE[degree];

    const majorThird = chordPcs.includes(mod12(rootPc + 4));

    // a major V in a minor key (the raised leading tone) is still the dominant
    if (degree === 7 && majorThird) return "Dominant";

    // a major chord a fifth above a chord of the key, leaning into it (e.g. D7 → G in C)
    if (majorThird && scalePcs.has(rootPc) && scalePcs.has(mod12(rootPc + 5))) return "Secondary dominant";

    return "Borrowed";
}
