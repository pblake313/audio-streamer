// "Inspired by" presets, built from community chord transcriptions of real
// songs (crowd-sourced, so treat them as close, not official). Each
// progression keeps its source song, key, scale and BPM.
//
// Chords are stored relative to the key: `at` is the root's distance from the
// tonic in semitones, `bass` (optional) is an inverted bass note, also in
// semitones from the tonic. That way any progression can be rebuilt in any key.

import {
    BEATS_PER_BAR,
    BASS_OCTAVE_C,
    MAX_NOTE,
    ROOTS,
    detectChord,
    effectiveNotes,
    type Chord,
    type Quality,
    type Root,
    type ScaleId,
} from "./chords";
import type { InstrumentId } from "./instruments";
import type { SavedChord, SavedProgression } from "./progressionsApi";

/** "Pierre Bourne" -> "pierre-bourne" (same rule as the backend) */
const artistKeyOf = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

type PatternChord = { at: number; quality: Quality; bass?: number };

export type Transcription = {
    song: string;
    key: Root;
    scale: ScaleId;
    bpm: number;
    chords: PatternChord[];
    // saved (imported) progressions keep their exact notes and timing instead
    exact?: SavedChord[];
    savedId?: string;
};

export type ArtistStyle = {
    id: string;
    name: string;
    vibe: string;
    sounds: InstrumentId[]; // sounds that suit the style (not applied automatically)
    songs: Transcription[];
};

const c = (at: number, quality: Quality, bass?: number): PatternChord => ({ at, quality, bass });

export const ARTIST_STYLES: ArtistStyle[] = [
    {
        id: "pierre",
        name: "Pierre Bourne",
        vibe: "Power chords, lush extended chords, inversions",
        sounds: ["pluck", "bellKeys", "electricPiano"],
        songs: [
            {
                // i(no3) VI7(no5) i64(no3) iv6sus2  →  B5  Gmaj7  B5/F#  Esus2/F#
                song: "Magnolia (Playboi Carti)",
                key: "B", scale: "minor", bpm: 163,
                chords: [c(0, "5"), c(8, "maj7"), c(0, "5", 7), c(5, "sus2", 7)],
            },
            {
                // I(add6add9) VII9 vi7(add11)  →  F#6/9  Emaj9  D#m7(add11)
                song: "Location (Playboi Carti), verse",
                key: "F#", scale: "mixolydian", bpm: 126,
                chords: [c(0, "6/9"), c(10, "maj9"), c(9, "m7add11")],
            },
            {
                // VI7 v7 i7 #iiiø7 #viø7  →  Fmaj7  Em7  Am7  C#m7b5  F#m7b5
                song: "Long Time (Playboi Carti)",
                key: "A", scale: "minor", bpm: 142,
                chords: [c(8, "maj7"), c(7, "m7"), c(0, "m7"), c(4, "m7b5"), c(9, "m7b5")],
            },
        ],
    },
    {
        id: "carti",
        name: "Playboi Carti",
        vibe: "Dark minor loops, inversions, 140-163 BPM",
        sounds: ["supersaw", "polySynth", "futureBass"],
        songs: [
            {
                // i iv11 v64sus4 III64  →  Dm  Gm11  Asus4/E  F/C
                song: "Sky",
                key: "D", scale: "minor", bpm: 140,
                chords: [c(0, "m"), c(5, "m11"), c(7, "sus4", 2), c(3, "", 10)],
            },
            {
                // VI7 i9  →  Ebmaj7  Gm9
                song: "Kid Cudi",
                key: "G", scale: "minor", bpm: 163,
                chords: [c(8, "maj7"), c(0, "m9")],
            },
            {
                // VII64 III6 VI6 III6 iio6  →  F/C  Bb/D  Eb/G  Bb/D  Adim/C
                song: "Fell In Luv",
                key: "G", scale: "minor", bpm: 163,
                chords: [c(10, "", 5), c(3, "", 7), c(8, "", 0), c(3, "", 7), c(2, "dim", 5)],
            },
            {
                // VI VII i  →  Eb  F  Gm
                song: "I SEEEE YOU BABY BOI",
                key: "G", scale: "minor", bpm: 145,
                chords: [c(8, ""), c(10, ""), c(0, "m")],
            },
        ],
    },
    {
        id: "juice",
        name: "Juice WRLD",
        vibe: "Emo melodic, minor 7ths and add9s",
        sounds: ["grandPiano", "stringPad", "feltPiano"],
        songs: [
            {
                // i v6 iv vsus4 V  →  F#m  C#m/E  Bm  C#sus4  C#
                song: "Lucid Dreams",
                key: "F#", scale: "minor", bpm: 84,
                chords: [c(0, "m"), c(7, "m", 10), c(5, "m"), c(7, "sus4"), c(7, "")],
            },
            {
                // i7 VI9 III6  →  Em7  Cmaj9  G/B
                song: "All Girls Are The Same",
                key: "E", scale: "minor", bpm: 164,
                chords: [c(0, "m7"), c(8, "maj9"), c(3, "", 7)],
            },
            {
                // IV I64 V6(add9)  →  G  D/A  Aadd9/C#
                song: "Robbery",
                key: "D", scale: "major", bpm: 80,
                chords: [c(5, ""), c(0, "", 7), c(7, "add9", 11)],
            },
            {
                // i7 VI(add9) III(add9)  →  Am7  Fadd9  Cadd9
                song: "Wishing Well",
                key: "A", scale: "minor", bpm: 150,
                chords: [c(0, "m7"), c(8, "add9"), c(3, "add9")],
            },
        ],
    },
    {
        id: "travis",
        name: "Travis Scott",
        vibe: "Dark Phrygian two-chord loops",
        sounds: ["darkPad", "cinematicPad", "sweepPad"],
        songs: [
            {
                // IV7 V/vi  →  Ebmaj7  D
                song: "Sicko Mode, intro",
                key: "Bb", scale: "major", bpm: 138,
                chords: [c(5, "maj7"), c(4, "")],
            },
            {
                // i II7  →  A#m  Bmaj7 (spelled Bbm  Bmaj7 here)
                song: "Antidote",
                key: "Bb", scale: "phrygian", bpm: 131,
                chords: [c(0, "m"), c(1, "maj7")],
            },
            {
                // i vii  →  Bm  Am
                song: "90210",
                key: "B", scale: "phrygian", bpm: 64,
                chords: [c(0, "m"), c(10, "m")],
            },
        ],
    },
    {
        id: "uzi",
        name: "Lil Uzi Vert",
        vibe: "Minor 7th loops and bright major turns",
        sounds: ["junoChords", "futureBass", "pluck"],
        songs: [
            {
                // VI7 v7 iv9 v7  →  Gmaj7  F#m7  Em9  F#m7
                song: "XO Tour Llif3",
                key: "B", scale: "minor", bpm: 156,
                chords: [c(8, "maj7"), c(7, "m7"), c(5, "m9"), c(7, "m7")],
            },
            {
                // vi7 V9 IV I6  →  D#m7  C#9  B  F#/A#
                song: "The Way Life Goes, chorus lead-out",
                key: "F#", scale: "major", bpm: 164,
                chords: [c(9, "m7"), c(7, "9"), c(5, ""), c(0, "", 4)],
            },
            {
                // isus2 VI(add11)  →  D#sus2  Badd11 (spelled Eb here)
                song: "Just Wanna Rock",
                key: "Eb", scale: "minor", bpm: 150,
                chords: [c(0, "sus2"), c(8, "add11")],
            },
            {
                // i VII VI  →  Bbm  Ab  Gb
                song: "Endless Fashion",
                key: "Bb", scale: "minor", bpm: 135,
                chords: [c(0, "m"), c(10, ""), c(8, "")],
            },
        ],
    },
    {
        id: "toliver",
        name: "Don Toliver",
        vibe: "Smooth minor and modal, 9ths and 11ths",
        sounds: ["electricPiano", "glassPad", "haloPad"],
        songs: [
            {
                // i7 III11  →  Am7  C11
                song: "After Party, intro",
                key: "A", scale: "phrygian", bpm: 80,
                chords: [c(0, "m7"), c(3, "11")],
            },
            {
                // i II V/III  →  Am  Bb  G
                song: "After Party, chorus",
                key: "A", scale: "phrygian", bpm: 80,
                chords: [c(0, "m"), c(1, ""), c(10, "")],
            },
            {
                // VII iv i III  →  G  Dm  Am  C
                song: "Lose My Mind",
                key: "A", scale: "minor", bpm: 114,
                chords: [c(10, ""), c(5, "m"), c(0, "m"), c(3, "")],
            },
            {
                // i9 VII9 v9 ii11  →  Fm9  Ebmaj9  Cm9  Gm11
                song: "No Pole",
                key: "F", scale: "dorian", bpm: 117,
                chords: [c(0, "m9"), c(10, "maj9"), c(7, "m9"), c(2, "m11")],
            },
        ],
    },
    {
        id: "metro",
        name: "Metro Boomin",
        vibe: "Dark minor with inversions",
        sounds: ["choir", "cinematicPad", "churchOrgan", "stringPad"],
        songs: [
            {
                // i v6 VI III64 V6  →  C#m  G#m/B  A  E/B  G#/C
                song: "Creepin' (with The Weeknd & 21 Savage)",
                key: "C#", scale: "minor", bpm: 98,
                chords: [c(0, "m"), c(7, "m", 10), c(8, ""), c(3, "", 10), c(7, "", 11)],
            },
        ],
    },
    {
        id: "durk",
        name: "Lil Durk",
        vibe: "Minor, piano-led, emotional",
        sounds: ["grandPiano", "feltPiano", "stringPad"],
        songs: [
            {
                // i VII6 III iv7 III  →  Cm  Bb/D  Eb  Fm7  Eb
                song: "All My Life (feat. J. Cole)",
                key: "C", scale: "minor", bpm: 143,
                chords: [c(0, "m"), c(10, "", 2), c(3, ""), c(5, "m7"), c(3, "")],
            },
        ],
    },
    {
        id: "gunna",
        name: "Gunna",
        vibe: "Only one transcription found (a feature)",
        sounds: ["electricPiano", "feltPiano", "warmPad"],
        songs: [
            {
                // I i  →  D  Dm
                song: "Brodies (Ufo361 feat. Gunna)",
                key: "D", scale: "minor", bpm: 78,
                chords: [c(0, ""), c(0, "m")],
            },
        ],
    },
];

const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

/** One transcribed chord rebuilt in a key, with its inverted bass note if it has one. */
function buildChord(keyRoot: Root, chord: PatternChord): Pick<Chord, "root" | "quality" | "notes" | "slashBass"> {
    const keyPc = ROOTS.indexOf(keyRoot);
    const root = ROOTS[(keyPc + chord.at) % 12];

    if (chord.bass === undefined) return { root, quality: chord.quality, notes: null, slashBass: null };

    // inversion: swap the auto bass note for the written one (in the auto bass octave)
    const notes = effectiveNotes({ root, quality: chord.quality });
    const bassPc = (keyPc + chord.bass) % 12;
    notes[0] = BASS_OCTAVE_C + bassPc;
    // keep the transcription's name (e.g. Esus2/F#) instead of re-naming from the bass
    return { root, quality: chord.quality, notes, slashBass: ROOTS[bassPc] };
}

/** Pulls a note into the piano roll's range (C1 up to MAX_NOTE) by octaves. */
const fitRange = (pitch: number) => {
    while (pitch > MAX_NOTE) pitch -= 12;
    while (pitch < 24) pitch += 12;
    return pitch;
};

/**
 * A saved progression in a key: its exact notes, moved by the shortest
 * distance to the new key, and its own timing, repeated to fill the loop.
 */
function buildExact(song: Transcription, keyRoot: Root, bars: number): Chord[] {
    let shift = (ROOTS.indexOf(keyRoot) - ROOTS.indexOf(song.key) + 12) % 12;
    if (shift > 6) shift -= 12;

    const totalBeats = bars * BEATS_PER_BAR;
    const lastEnd = Math.max(...song.exact!.map((c) => c.start + c.beats));
    const length = Math.ceil(lastEnd / BEATS_PER_BAR) * BEATS_PER_BAR || BEATS_PER_BAR;

    const chords: Chord[] = [];
    for (let offset = 0; offset < totalBeats; offset += length) {
        for (const c of song.exact!) {
            const start = c.start + offset;
            if (start >= totalBeats) continue;
            const notes = [...new Set(c.notes.map((n) => fitRange(n + shift)))].sort((a, b) => a - b);
            const detected = detectChord(notes);
            chords.push({
                root: detected?.root ?? ROOTS[notes[0] % 12],
                quality: detected?.quality ?? (notes.length === 1 ? "1" : ""),
                start,
                beats: Math.min(c.beats, totalBeats - start),
                notes,
                slashBass: null,
            });
        }
    }
    return chords;
}

/** A transcribed progression in a key, one chord per bar (it repeats to fill the loop). */
export function buildProgression(song: Transcription, keyRoot: Root, bars: number): Chord[] {
    if (song.exact) return buildExact(song, keyRoot, bars);
    return Array.from({ length: bars }, (_, bar) => ({
        ...buildChord(keyRoot, song.chords[bar % song.chords.length]),
        start: bar * BEATS_PER_BAR,
        beats: BEATS_PER_BAR,
    }));
}

/** Shuffle within an artist: a random one of their transcriptions, in the current key. */
export function styleChords(style: ArtistStyle, keyRoot: Root, bars: number) {
    const song = pick(style.songs);
    return { song, scale: song.scale, chords: buildProgression(song, keyRoot, bars) };
}

/** Picking an artist: a random transcription in its original key, scale and tempo. */
export function applyStyle(style: ArtistStyle, bars: number) {
    const song = pick(style.songs);
    return {
        song,
        keyRoot: song.key,
        scale: song.scale,
        bpm: Math.min(200, Math.max(40, song.bpm)),
        chords: buildProgression(song, song.key, bars),
    };
}

/**
 * The built-in artists plus the user's saved progressions: saved ones join
 * the matching artist (by name), or become a new artist of their own.
 */
export function withSavedProgressions(saved: SavedProgression[]): ArtistStyle[] {
    const styles = ARTIST_STYLES.map((style) => ({ ...style, songs: [...style.songs] }));

    for (const p of saved) {
        const song: Transcription = {
            song: p.song,
            key: p.keyRoot,
            scale: p.scale,
            bpm: p.bpm,
            chords: [],
            exact: p.chords,
            savedId: p.id,
        };

        let style = styles.find((s) => artistKeyOf(s.name) === p.artistKey);
        if (!style) {
            style = { id: `saved-${p.artistKey}`, name: p.artist, vibe: "Your saved progressions", sounds: [], songs: [] };
            styles.push(style);
        }
        style.songs.push(song);
    }
    return styles;
}

// ---------- generating new progressions in an artist's style ----------
//
// Every progression the artist has (transcriptions + saved ones) is turned
// into a list of chord "tokens" measured from its key (root distance, type,
// bass). From those we learn which chords they start on, which chord tends to
// follow which (wrapping around, since these are loops), and how long their
// progressions are. A new progression is a walk through those habits.

type Token = { at: number; quality: Quality; bass?: number };

const tokenKey = (t: Token) => `${t.at}|${t.quality}|${t.bass ?? ""}`;

/** A song as tokens relative to its key (saved songs are analyzed from their notes). */
function songTokens(song: Transcription): Token[] {
    if (!song.exact) return song.chords.map((c) => ({ at: c.at, quality: c.quality, bass: c.bass }));

    const keyPc = ROOTS.indexOf(song.key);
    return [...song.exact]
        .sort((a, b) => a.start - b.start)
        .map((c) => {
            const notes = [...c.notes].sort((a, b) => a - b);
            const detected = detectChord(notes);
            const rootPc = detected ? ROOTS.indexOf(detected.root) : notes[0] % 12;
            const bassPc = notes[0] % 12;
            return {
                at: (rootPc - keyPc + 12) % 12,
                quality: detected?.quality ?? (notes.length === 1 ? "1" : ""),
                bass: bassPc !== rootPc ? (bassPc - keyPc + 12) % 12 : undefined,
            };
        });
}

/** Picks from a weighted list: [item, weight][]. */
function weighted<T>(entries: [T, number][]): T {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * total;
    for (const [item, w] of entries) {
        roll -= w;
        if (roll <= 0) return item;
    }
    return entries[entries.length - 1][0];
}

/**
 * A brand-new progression in an artist's style, built in `keyRoot`.
 *
 * Movement is learned on root notes (e.g. "from the 1 they go to the 6 or
 * the 4"), pooled across all their songs, which gives far more variety than
 * copying exact chords. Each root then gets a chord type the artist actually
 * used on that root (e.g. a 6 might be maj7 or maj9), inversions included.
 */
export function generateInStyle(style: ArtistStyle, keyRoot: Root, bars: number) {
    const corpus = style.songs.map((song) => ({ song, tokens: songTokens(song) })).filter((s) => s.tokens.length);
    if (!corpus.length) return null;

    const starts = new Map<number, number>(); // opening root -> count
    const next = new Map<number, Map<number, number>>(); // root -> following root -> count
    const voicings = new Map<number, Map<string, Token>>(); // root -> the chords used on it
    const voicingCounts = new Map<string, number>();
    const bump = <K>(map: Map<K, number>, key: K) => map.set(key, (map.get(key) ?? 0) + 1);

    for (const { tokens } of corpus) {
        tokens.forEach((t, i) => {
            if (i === 0) bump(starts, t.at);
            const following = tokens[(i + 1) % tokens.length].at; // loops wrap around
            if (!next.has(t.at)) next.set(t.at, new Map());
            bump(next.get(t.at)!, following);
            if (!voicings.has(t.at)) voicings.set(t.at, new Map());
            voicings.get(t.at)!.set(tokenKey(t), t);
            bump(voicingCounts, tokenKey(t));
        });
    }

    // how many chords: one of the artist's own lengths that fits the loop
    // (up to two chords per bar)
    const fits = corpus.map((s) => s.tokens.length).filter((n) => n <= bars * 2);
    const length = fits.length ? fits[Math.floor(Math.random() * fits.length)] : Math.min(bars * 2, 4);

    const walk = (): Token[] => {
        const roots = [weighted([...starts.entries()])];
        while (roots.length < length) {
            const prev = roots[roots.length - 1];
            // don't sit on the same root twice in a row unless it's all they do
            const options = [...(next.get(prev) ?? new Map()).entries()].filter(([r]) => r !== prev);
            roots.push(options.length ? weighted(options) : weighted([...starts.entries()]));
        }
        return roots.map((root) => {
            const choices = [...voicings.get(root)!.entries()].map(
                ([k, t]) => [t, voicingCounts.get(k) ?? 1] as [Token, number],
            );
            return weighted(choices);
        });
    };

    // prefer something that isn't an exact copy of one of their songs
    const songs = new Set(corpus.map((s) => s.tokens.map(tokenKey).join(" ")));
    let seq = walk();
    for (let tries = 0; songs.has(seq.map(tokenKey).join(" ")) && tries < 25; tries++) seq = walk();

    // the scale that goes with it: from a song that opens on the same root
    const opening = seq[0].at;
    const withOpening = corpus.filter((s) => s.tokens.some((t) => t.at === opening));
    const scale = weighted((withOpening.length ? withOpening : corpus).map((s) => [s.song.scale, 1] as [ScaleId, number]));

    const beatsEach = length <= bars ? BEATS_PER_BAR : BEATS_PER_BAR / 2;
    const totalBeats = bars * BEATS_PER_BAR;
    const chords: Chord[] = [];
    for (let start = 0, i = 0; start < totalBeats; start += beatsEach, i++) {
        chords.push({ ...buildChord(keyRoot, seq[i % seq.length]), start, beats: beatsEach });
    }
    return { scale, chords };
}

/** A key and tempo typical of the artist, for the dice. */
export function typicalKeyAndTempo(style: ArtistStyle) {
    const song = style.songs[Math.floor(Math.random() * style.songs.length)];
    const bpms = style.songs.map((s) => s.bpm);
    const lo = Math.min(...bpms);
    const hi = Math.max(...bpms);
    return {
        keyRoot: song.key,
        bpm: Math.round(Math.min(200, Math.max(40, lo + Math.random() * (hi - lo)))),
    };
}
