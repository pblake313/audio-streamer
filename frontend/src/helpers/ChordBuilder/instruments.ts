// Instrument presets for the chord looper's synth voice.
// Every sound is built from the same pieces: oscillators -> lowpass filter ->
// amp envelope, plus optional vibrato (pads) or FM (electric piano).

export const INSTRUMENT_GROUPS = ["Pianos", "Keys & Mallets", "Pads", "Synths"] as const;
export type InstrumentGroup = (typeof INSTRUMENT_GROUPS)[number];

export type Patch = {
    label: string;
    group: InstrumentGroup;

    oscillators: {
        type: OscillatorType;
        detune?: number; // cents
        ratio?: number; // frequency multiple (2 = an octave up)
        level: number;
    }[];

    filter: {
        from: number; // Hz at note start
        to: number; // Hz it settles to
        time: number; // how quickly it gets there (time constant, s)
        q?: number;
    };

    amp: {
        attack: number; // s
        peak: number;
        sustain: number; // 0 = the note dies away on its own, like a struck string
        decay: number; // time constant towards the sustain level, s
        release: number; // s
        keyTrack?: boolean; // low notes ring longer than high ones (pianos)
    };

    strum: number; // s between notes of a chord
    vibrato?: { rate: number; depth: number }; // Hz, cents
    fm?: { ratio: number; index: number; decay: number }; // electric-piano bell
};

export const INSTRUMENTS = {
    // ---------- pianos ----------
    grandPiano: {
        label: "Midnight Grand",
        group: "Pianos",
        oscillators: [
            { type: "sawtooth", detune: -3, level: 0.32 },
            { type: "triangle", detune: 3, level: 0.55 },
            { type: "sine", ratio: 2, level: 0.18 },
        ],
        // bright hammer strike that mellows quickly
        filter: { from: 5200, to: 1100, time: 0.25, q: 0.4 },
        amp: { attack: 0.004, peak: 0.2, sustain: 0, decay: 1.1, release: 0.25, keyTrack: true },
        strum: 0.014,
    },
    electricPiano: {
        label: "Rhodes Haze",
        group: "Pianos",
        oscillators: [
            { type: "sine", level: 0.75 },
            { type: "sine", ratio: 2, level: 0.12 },
        ],
        filter: { from: 4200, to: 2600, time: 0.4 },
        amp: { attack: 0.005, peak: 0.22, sustain: 0.04, decay: 0.9, release: 0.3, keyTrack: true },
        strum: 0.012,
        fm: { ratio: 1, index: 2.2, decay: 0.35 },
        vibrato: { rate: 4.8, depth: 4 }, // a touch of tremolo-like wobble
    },
    softKeys: {
        label: "Soft Focus",
        group: "Pianos",
        oscillators: [
            { type: "triangle", detune: -6, level: 0.6 },
            { type: "sawtooth", detune: 7, level: 0.18 },
        ],
        filter: { from: 2400, to: 1200, time: 0.6, q: 0.5 },
        amp: { attack: 0.03, peak: 0.13, sustain: 0.08, decay: 0.4, release: 0.25 },
        strum: 0.012,
    },
    uprightPiano: {
        label: "Parlor Upright",
        group: "Pianos",
        oscillators: [
            { type: "sawtooth", detune: -5, level: 0.24 },
            { type: "triangle", detune: 5, level: 0.6 },
            { type: "sine", ratio: 2, detune: 6, level: 0.1 },
        ],
        // darker and woodier than the grand, slightly out of tune
        filter: { from: 3000, to: 800, time: 0.2, q: 0.6 },
        amp: { attack: 0.005, peak: 0.2, sustain: 0, decay: 0.85, release: 0.2, keyTrack: true },
        strum: 0.016,
    },

    feltPiano: {
        label: "Velvet Felt",
        group: "Pianos",
        oscillators: [
            { type: "triangle", level: 0.6 },
            { type: "sine", ratio: 2, level: 0.12 },
        ],
        // felt over the hammers: very little brightness
        filter: { from: 1400, to: 600, time: 0.25, q: 0.4 },
        amp: { attack: 0.008, peak: 0.22, sustain: 0, decay: 1, release: 0.3, keyTrack: true },
        strum: 0.018,
    },
    brightGrand: {
        label: "Studio Spotlight",
        group: "Pianos",
        oscillators: [
            { type: "sawtooth", detune: -2, level: 0.36 },
            { type: "triangle", detune: 2, level: 0.45 },
            { type: "sine", ratio: 2, level: 0.15 },
            { type: "sine", ratio: 3, level: 0.05 },
        ],
        filter: { from: 7500, to: 1800, time: 0.3, q: 0.5 },
        amp: { attack: 0.003, peak: 0.19, sustain: 0, decay: 1.1, release: 0.25, keyTrack: true },
        strum: 0.012,
    },
    honkyTonk: {
        label: "Whiskey Saloon",
        group: "Pianos",
        oscillators: [
            { type: "sawtooth", detune: -16, level: 0.24 },
            { type: "sawtooth", detune: 16, level: 0.24 }, // the two strings disagree
            { type: "triangle", level: 0.3 },
        ],
        filter: { from: 4500, to: 1300, time: 0.25, q: 0.6 },
        amp: { attack: 0.004, peak: 0.18, sustain: 0, decay: 0.9, release: 0.2, keyTrack: true },
        strum: 0.018,
    },
    lofiPiano: {
        label: "Cassette Keys",
        group: "Pianos",
        oscillators: [
            { type: "triangle", detune: -6, level: 0.5 },
            { type: "sawtooth", detune: 6, level: 0.12 },
        ],
        filter: { from: 1800, to: 900, time: 0.3, q: 0.6 },
        amp: { attack: 0.006, peak: 0.2, sustain: 0, decay: 0.95, release: 0.3, keyTrack: true },
        strum: 0.02,
        vibrato: { rate: 0.8, depth: 12 }, // tape wow
    },
    wurlitzer: {
        label: "Reed Room",
        group: "Pianos",
        oscillators: [
            { type: "triangle", level: 0.55 },
            { type: "square", ratio: 2, level: 0.05 },
        ],
        filter: { from: 3600, to: 1500, time: 0.35, q: 1.5 },
        amp: { attack: 0.004, peak: 0.2, sustain: 0.03, decay: 0.85, release: 0.25, keyTrack: true },
        strum: 0.012,
        fm: { ratio: 1, index: 1.4, decay: 0.2 },
        vibrato: { rate: 5.5, depth: 5 },
    },
    electricGrand: {
        label: "Neon Ballad",
        group: "Pianos",
        oscillators: [
            { type: "sawtooth", level: 0.25 },
            { type: "sine", level: 0.4 },
            { type: "sine", ratio: 2, level: 0.12 },
        ],
        filter: { from: 6000, to: 2200, time: 0.3, q: 0.8 },
        amp: { attack: 0.003, peak: 0.18, sustain: 0.02, decay: 1, release: 0.3, keyTrack: true },
        strum: 0.012,
        fm: { ratio: 2, index: 0.7, decay: 0.15 },
        vibrato: { rate: 0.7, depth: 5 }, // a touch of chorus
    },
    toyPiano: {
        label: "Nursery Chimes",
        group: "Pianos",
        oscillators: [
            { type: "sine", ratio: 2, level: 0.45 },
            { type: "square", ratio: 2, level: 0.05 },
        ],
        filter: { from: 7000, to: 3500, time: 0.2 },
        amp: { attack: 0.001, peak: 0.16, sustain: 0, decay: 0.45, release: 0.12, keyTrack: true },
        strum: 0.03,
        fm: { ratio: 3.7, index: 1, decay: 0.08 }, // metal-rod clank
    },

    // ---------- keys & mallets ----------
    organ: {
        label: "Sunday Drawbars",
        group: "Keys & Mallets",
        // drawbar-style stack of pure tones
        oscillators: [
            { type: "sine", ratio: 0.5, level: 0.3 },
            { type: "sine", level: 0.4 },
            { type: "sine", ratio: 2, level: 0.25 },
            { type: "sine", ratio: 3, level: 0.12 },
            { type: "sine", ratio: 4, level: 0.08 },
        ],
        filter: { from: 6000, to: 6000, time: 1 },
        amp: { attack: 0.012, peak: 0.12, sustain: 0.12, decay: 1, release: 0.08 },
        strum: 0,
        vibrato: { rate: 6.5, depth: 5 }, // rotary-speaker shimmer
    },
    bellKeys: {
        label: "Crystal Bells",
        group: "Keys & Mallets",
        oscillators: [
            { type: "sine", level: 0.6 },
            { type: "sine", ratio: 2, level: 0.12 },
        ],
        filter: { from: 7000, to: 4000, time: 0.8 },
        amp: { attack: 0.003, peak: 0.18, sustain: 0.02, decay: 1.4, release: 0.5, keyTrack: true },
        strum: 0.014,
        fm: { ratio: 3.5, index: 3, decay: 0.6 }, // inharmonic, bell-like partials
    },
    musicBox: {
        label: "Wind-Up Dreams",
        group: "Keys & Mallets",
        oscillators: [
            { type: "sine", ratio: 2, level: 0.6 }, // sits an octave up, small and sweet
            { type: "sine", ratio: 8, level: 0.08 },
        ],
        filter: { from: 9000, to: 6000, time: 0.5 },
        amp: { attack: 0.002, peak: 0.16, sustain: 0, decay: 0.55, release: 0.15, keyTrack: true },
        strum: 0.035,
    },
    marimba: {
        label: "Rosewood",
        group: "Keys & Mallets",
        oscillators: [
            { type: "sine", level: 0.75 },
            { type: "sine", ratio: 4, level: 0.18 }, // the wooden bar's bright overtone
            { type: "triangle", ratio: 10, level: 0.03 },
        ],
        filter: { from: 5000, to: 1500, time: 0.08 },
        amp: { attack: 0.002, peak: 0.24, sustain: 0, decay: 0.32, release: 0.1, keyTrack: true },
        strum: 0.02,
    },

    vibraphone: {
        label: "Smoky Vibes",
        group: "Keys & Mallets",
        oscillators: [
            { type: "sine", level: 0.65 },
            { type: "sine", ratio: 4, level: 0.08 },
        ],
        filter: { from: 5000, to: 3000, time: 0.5 },
        amp: { attack: 0.003, peak: 0.2, sustain: 0.02, decay: 1.3, release: 0.4, keyTrack: true },
        strum: 0.015,
        vibrato: { rate: 5.5, depth: 6 }, // the motor-driven vibe
    },
    celesta: {
        label: "Sugar Plum",
        group: "Keys & Mallets",
        oscillators: [
            { type: "sine", ratio: 2, level: 0.55 },
            { type: "sine", ratio: 4, level: 0.1 },
        ],
        filter: { from: 8000, to: 5000, time: 0.4 },
        amp: { attack: 0.002, peak: 0.16, sustain: 0, decay: 0.7, release: 0.25, keyTrack: true },
        strum: 0.025,
        fm: { ratio: 2, index: 0.8, decay: 0.15 },
    },
    glockenspiel: {
        label: "Silver Sparkle",
        group: "Keys & Mallets",
        oscillators: [
            { type: "sine", ratio: 2, level: 0.5 },
            { type: "sine", ratio: 5.4, level: 0.1 }, // inharmonic metal partial
        ],
        filter: { from: 10000, to: 7000, time: 0.5 },
        amp: { attack: 0.001, peak: 0.15, sustain: 0, decay: 0.9, release: 0.3, keyTrack: true },
        strum: 0.03,
    },
    kalimba: {
        label: "Thumb Garden",
        group: "Keys & Mallets",
        oscillators: [
            { type: "sine", level: 0.6 },
            { type: "triangle", ratio: 2, level: 0.08 },
        ],
        filter: { from: 6000, to: 2500, time: 0.15 },
        amp: { attack: 0.002, peak: 0.22, sustain: 0, decay: 0.45, release: 0.15, keyTrack: true },
        strum: 0.03,
        fm: { ratio: 7, index: 1.2, decay: 0.06 }, // the metal tine plink
    },
    steelPan: {
        label: "Island Pan",
        group: "Keys & Mallets",
        oscillators: [
            { type: "sine", level: 0.55 },
            { type: "sine", ratio: 2, level: 0.18 },
        ],
        filter: { from: 5000, to: 2200, time: 0.3 },
        amp: { attack: 0.004, peak: 0.2, sustain: 0.01, decay: 0.6, release: 0.2, keyTrack: true },
        strum: 0.025,
        fm: { ratio: 1.5, index: 1.4, decay: 0.2 },
    },
    harpsichord: {
        label: "Baroque Court",
        group: "Keys & Mallets",
        oscillators: [
            { type: "sawtooth", level: 0.28 },
            { type: "sawtooth", ratio: 2, detune: 4, level: 0.12 },
        ],
        filter: { from: 7000, to: 2800, time: 0.25, q: 1 },
        amp: { attack: 0.002, peak: 0.15, sustain: 0, decay: 0.8, release: 0.12, keyTrack: true },
        strum: 0.022,
    },
    clavinet: {
        label: "Funk Clav",
        group: "Keys & Mallets",
        oscillators: [
            { type: "square", level: 0.2 },
            { type: "sawtooth", ratio: 2, level: 0.08 },
        ],
        filter: { from: 4500, to: 1200, time: 0.12, q: 5 },
        amp: { attack: 0.002, peak: 0.16, sustain: 0.03, decay: 0.35, release: 0.08, keyTrack: true },
        strum: 0.008,
    },
    churchOrgan: {
        label: "Cathedral",
        group: "Keys & Mallets",
        oscillators: [
            { type: "sine", ratio: 0.5, level: 0.3 },
            { type: "sine", level: 0.3 },
            { type: "triangle", ratio: 1.5, level: 0.08 }, // the fifth (quint) stop
            { type: "sine", ratio: 2, level: 0.2 },
            { type: "sine", ratio: 4, level: 0.08 },
        ],
        filter: { from: 5000, to: 5000, time: 1 },
        amp: { attack: 0.08, peak: 0.1, sustain: 0.1, decay: 1, release: 0.5 },
        strum: 0,
    },

    // ---------- pads ----------
    warmPad: {
        label: "Warm Blanket",
        group: "Pads",
        oscillators: [
            { type: "sawtooth", detune: -9, level: 0.22 },
            { type: "sawtooth", detune: 9, level: 0.22 },
            { type: "triangle", ratio: 0.5, level: 0.2 },
        ],
        filter: { from: 500, to: 950, time: 0.8, q: 0.7 },
        amp: { attack: 0.45, peak: 0.11, sustain: 0.1, decay: 1, release: 0.9 },
        strum: 0,
        vibrato: { rate: 0.35, depth: 6 }, // slow drift
    },
    glassPad: {
        label: "Frosted Glass",
        group: "Pads",
        oscillators: [
            { type: "sine", detune: -5, level: 0.45 },
            { type: "sine", detune: 5, level: 0.45 },
            { type: "triangle", ratio: 2, detune: 4, level: 0.16 },
            { type: "sine", ratio: 3, level: 0.05 },
        ],
        filter: { from: 3800, to: 3000, time: 1 },
        amp: { attack: 0.3, peak: 0.12, sustain: 0.1, decay: 1, release: 1.2 },
        strum: 0,
        vibrato: { rate: 0.6, depth: 5 },
    },
    stringPad: {
        label: "Silk Strings",
        group: "Pads",
        oscillators: [
            { type: "sawtooth", detune: -12, level: 0.18 },
            { type: "sawtooth", level: 0.18 },
            { type: "sawtooth", detune: 12, level: 0.18 },
        ],
        filter: { from: 1400, to: 2300, time: 0.6, q: 0.3 },
        amp: { attack: 0.35, peak: 0.1, sustain: 0.09, decay: 0.8, release: 0.7 },
        strum: 0.02, // like a section coming in slightly staggered
        vibrato: { rate: 5.2, depth: 7 }, // bowed-string vibrato
    },
    darkPad: {
        label: "Deep Water",
        group: "Pads",
        oscillators: [
            { type: "sawtooth", detune: -7, level: 0.22 },
            { type: "sawtooth", detune: 7, level: 0.22 },
            { type: "sine", ratio: 0.5, level: 0.3 },
        ],
        filter: { from: 300, to: 620, time: 1.2, q: 1.2 },
        amp: { attack: 0.6, peak: 0.12, sustain: 0.11, decay: 1, release: 1.3 },
        strum: 0,
        vibrato: { rate: 0.25, depth: 8 },
    },
    sweepPad: {
        label: "Slow Sunrise",
        group: "Pads",
        oscillators: [
            { type: "sawtooth", detune: -10, level: 0.2 },
            { type: "square", detune: 10, level: 0.12 },
            { type: "sawtooth", ratio: 2, level: 0.08 },
        ],
        // the filter slowly opens across each chord
        filter: { from: 250, to: 3200, time: 1.6, q: 3 },
        amp: { attack: 0.25, peak: 0.1, sustain: 0.1, decay: 1, release: 1 },
        strum: 0,
        vibrato: { rate: 0.4, depth: 6 },
    },
    choir: {
        label: "Angel Choir",
        group: "Pads",
        oscillators: [
            { type: "triangle", detune: -9, level: 0.35 },
            { type: "triangle", level: 0.35 },
            { type: "triangle", detune: 9, level: 0.35 },
            { type: "sawtooth", level: 0.06 },
        ],
        // a resonant peak around the "ah" vowel
        filter: { from: 1300, to: 950, time: 0.6, q: 5 },
        amp: { attack: 0.4, peak: 0.12, sustain: 0.11, decay: 0.8, release: 0.9 },
        strum: 0.015,
        vibrato: { rate: 5, depth: 10 },
    },

    ambientPad: {
        label: "Endless Horizon",
        group: "Pads",
        oscillators: [
            { type: "sine", detune: -6, level: 0.4 },
            { type: "sine", detune: 6, level: 0.4 },
            { type: "triangle", ratio: 2, detune: 3, level: 0.12 }, // shimmer an octave up
        ],
        filter: { from: 2600, to: 2200, time: 2 },
        // very slow swell and a long tail that overlaps the next chord
        amp: { attack: 0.9, peak: 0.12, sustain: 0.12, decay: 1.5, release: 1.8 },
        strum: 0,
        vibrato: { rate: 0.2, depth: 7 },
    },
    lofiPad: {
        label: "Dusty Daydream",
        group: "Pads",
        oscillators: [
            { type: "triangle", detune: -12, level: 0.4 },
            { type: "triangle", detune: 10, level: 0.4 },
            { type: "sawtooth", level: 0.06 },
        ],
        // dark and dusty, with a slow tape-warble in the pitch
        filter: { from: 900, to: 750, time: 1, q: 0.8 },
        amp: { attack: 0.18, peak: 0.13, sustain: 0.11, decay: 0.9, release: 0.7 },
        strum: 0.01,
        vibrato: { rate: 0.9, depth: 14 },
    },
    analogPad: {
        label: "Neon Dusk",
        group: "Pads",
        oscillators: [
            { type: "square", detune: -8, level: 0.14 },
            { type: "square", detune: 8, level: 0.14 },
            { type: "sawtooth", ratio: 0.5, level: 0.1 },
        ],
        // the classic 80s poly-synth pad: resonant filter, gentle bloom
        filter: { from: 700, to: 1700, time: 0.9, q: 2.5 },
        amp: { attack: 0.3, peak: 0.11, sustain: 0.1, decay: 1, release: 0.8 },
        strum: 0,
        vibrato: { rate: 0.5, depth: 5 },
    },
    haloPad: {
        label: "Halo",
        group: "Pads",
        oscillators: [
            { type: "sine", level: 0.45 },
            { type: "triangle", detune: 7, level: 0.25 },
            { type: "sine", ratio: 1.5, level: 0.07 }, // a soft fifth above: the "glow"
            { type: "sine", ratio: 2, detune: -5, level: 0.1 },
        ],
        filter: { from: 3200, to: 2400, time: 1.2 },
        amp: { attack: 0.5, peak: 0.12, sustain: 0.11, decay: 1.2, release: 1.4 },
        strum: 0,
        vibrato: { rate: 0.45, depth: 6 },
    },
    cinematicPad: {
        label: "Trailer Swell",
        group: "Pads",
        oscillators: [
            { type: "sawtooth", detune: -10, level: 0.16 },
            { type: "sawtooth", detune: 10, level: 0.16 },
            { type: "sawtooth", ratio: 0.5, level: 0.12 }, // sub octave for weight
            { type: "sine", ratio: 0.5, level: 0.2 },
        ],
        // starts dark and slowly opens up across the chord: a trailer-style swell
        filter: { from: 350, to: 2000, time: 2.2, q: 1.2 },
        amp: { attack: 0.7, peak: 0.12, sustain: 0.12, decay: 1.5, release: 1.5 },
        strum: 0,
        vibrato: { rate: 0.3, depth: 5 },
    },

    motionPad: {
        label: "Swirl",
        group: "Pads",
        oscillators: [
            { type: "sawtooth", detune: -12, level: 0.15 },
            { type: "triangle", detune: 12, level: 0.3 },
            { type: "sine", ratio: 2, level: 0.08 },
        ],
        filter: { from: 600, to: 2400, time: 1.4, q: 2.5 },
        amp: { attack: 0.4, peak: 0.12, sustain: 0.11, decay: 1, release: 1.1 },
        strum: 0,
        vibrato: { rate: 1.6, depth: 12 }, // fast swirl
    },

    // ---------- synths ----------
    pluck: {
        label: "Pixel Pluck",
        group: "Synths",
        oscillators: [
            { type: "sawtooth", level: 0.4 },
            { type: "square", ratio: 2, level: 0.1 },
        ],
        filter: { from: 4500, to: 450, time: 0.12, q: 2 },
        amp: { attack: 0.002, peak: 0.2, sustain: 0, decay: 0.28, release: 0.12, keyTrack: true },
        strum: 0.01,
    },
    supersaw: {
        label: "Festival Saw",
        group: "Synths",
        // five detuned saws: the big trance/EDM chord
        oscillators: [
            { type: "sawtooth", detune: -24, level: 0.1 },
            { type: "sawtooth", detune: -11, level: 0.1 },
            { type: "sawtooth", level: 0.1 },
            { type: "sawtooth", detune: 11, level: 0.1 },
            { type: "sawtooth", detune: 24, level: 0.1 },
        ],
        filter: { from: 3600, to: 2600, time: 0.5, q: 0.6 },
        amp: { attack: 0.02, peak: 0.12, sustain: 0.1, decay: 0.6, release: 0.35 },
        strum: 0,
    },
    analogBrass: {
        label: "Brass Machine",
        group: "Synths",
        oscillators: [
            { type: "sawtooth", detune: -6, level: 0.28 },
            { type: "sawtooth", detune: 6, level: 0.28 },
        ],
        // brassy "bwah": the filter swells open then settles
        filter: { from: 2800, to: 1300, time: 0.35, q: 1.5 },
        amp: { attack: 0.06, peak: 0.13, sustain: 0.1, decay: 0.5, release: 0.25 },
        strum: 0.01,
        vibrato: { rate: 5.5, depth: 4 },
    },
    polySynth: {
        label: "Poly Punch",
        group: "Synths",
        oscillators: [
            { type: "sawtooth", detune: -7, level: 0.2 },
            { type: "sawtooth", detune: 7, level: 0.2 },
            { type: "square", ratio: 0.5, level: 0.08 },
        ],
        filter: { from: 4200, to: 1800, time: 0.3, q: 1 },
        amp: { attack: 0.01, peak: 0.13, sustain: 0.09, decay: 0.5, release: 0.3 },
        strum: 0,
        vibrato: { rate: 0.6, depth: 4 },
    },
    houseStab: {
        label: "Warehouse Stab",
        group: "Synths",
        oscillators: [
            { type: "sawtooth", detune: -9, level: 0.22 },
            { type: "sawtooth", detune: 9, level: 0.22 },
            { type: "square", ratio: 2, level: 0.06 },
        ],
        filter: { from: 3800, to: 600, time: 0.14, q: 3.5 },
        amp: { attack: 0.003, peak: 0.2, sustain: 0, decay: 0.32, release: 0.1 },
        strum: 0,
    },
    futureBass: {
        label: "Future Glow",
        group: "Synths",
        oscillators: [
            { type: "sawtooth", detune: -20, level: 0.1 },
            { type: "sawtooth", detune: -8, level: 0.1 },
            { type: "sawtooth", detune: 8, level: 0.1 },
            { type: "sawtooth", detune: 20, level: 0.1 },
            { type: "square", ratio: 2, level: 0.04 },
        ],
        filter: { from: 1600, to: 4200, time: 0.25, q: 0.8 },
        amp: { attack: 0.05, peak: 0.12, sustain: 0.1, decay: 0.6, release: 0.35 },
        strum: 0,
        vibrato: { rate: 5.5, depth: 6 },
    },
    chiptune: {
        label: "8-Bit Hero",
        group: "Synths",
        oscillators: [{ type: "square", level: 0.2 }],
        filter: { from: 9000, to: 9000, time: 1 },
        amp: { attack: 0.002, peak: 0.1, sustain: 0.08, decay: 0.3, release: 0.05 },
        strum: 0.02,
    },
    hollowSynth: {
        label: "Hollow Wood",
        group: "Synths",
        oscillators: [
            { type: "square", detune: -4, level: 0.15 },
            { type: "triangle", ratio: 2, level: 0.2 },
        ],
        filter: { from: 2200, to: 1300, time: 0.4, q: 4 },
        amp: { attack: 0.01, peak: 0.13, sustain: 0.08, decay: 0.6, release: 0.3 },
        strum: 0.01,
        vibrato: { rate: 3.5, depth: 4 },
    },
    junoChords: {
        label: "Retro Chorus",
        group: "Synths",
        oscillators: [
            { type: "sawtooth", detune: -11, level: 0.18 },
            { type: "square", detune: 11, level: 0.12 },
            { type: "sawtooth", ratio: 0.5, level: 0.08 },
        ],
        filter: { from: 2600, to: 1500, time: 0.5, q: 1.5 },
        amp: { attack: 0.02, peak: 0.12, sustain: 0.1, decay: 0.7, release: 0.4 },
        strum: 0,
        vibrato: { rate: 0.8, depth: 9 }, // the famous chorus wobble
    },
    synthStrings: {
        label: "String Machine",
        group: "Synths",
        oscillators: [
            { type: "sawtooth", detune: -14, level: 0.15 },
            { type: "sawtooth", level: 0.15 },
            { type: "sawtooth", detune: 14, level: 0.15 },
            { type: "sawtooth", ratio: 2, level: 0.05 },
        ],
        filter: { from: 2000, to: 2600, time: 0.5, q: 0.4 },
        amp: { attack: 0.18, peak: 0.1, sustain: 0.09, decay: 0.8, release: 0.6 },
        strum: 0,
        vibrato: { rate: 4.2, depth: 8 },
    },
    digitalBell: {
        label: "DX Crystal",
        group: "Synths",
        oscillators: [
            { type: "sine", level: 0.55 },
            { type: "sine", ratio: 3, level: 0.06 },
        ],
        filter: { from: 9000, to: 5000, time: 0.6 },
        amp: { attack: 0.002, peak: 0.17, sustain: 0.03, decay: 1.2, release: 0.6, keyTrack: true },
        strum: 0.012,
        fm: { ratio: 5, index: 2.5, decay: 0.45 },
    },
} satisfies Record<string, Patch>;

export type InstrumentId = keyof typeof INSTRUMENTS;

export const INSTRUMENT_IDS = Object.keys(INSTRUMENTS) as InstrumentId[];
