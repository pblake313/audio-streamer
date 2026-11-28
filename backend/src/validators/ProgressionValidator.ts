// Checks a chord progression sent from the Chord Builder before it's stored
// (POST /secure/midi/progressions). Only the parsed chords are stored, never
// the raw MIDI file.

const ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const SCALES = [
    "none", "major", "minor", "dorian", "phrygian", "lydian", "mixolydian",
    "harmonicMinor", "melodicMinor", "majorPentatonic", "minorPentatonic", "blues",
];

const MAX_CHORDS = 64;
const MAX_NOTES_PER_CHORD = 12;
const MAX_TOTAL_BEATS = 48; // 12 bars, the longest loop the Chord Builder makes

export interface StoredChord {
    start: number;
    beats: number;
    notes: number[];
}

export interface ProgressionInput {
    artist: string;
    artistKey: string; // lowercase slug used to group/fetch by artist
    song: string;
    keyRoot: string;
    scale: string;
    bpm: number;
    chords: StoredChord[];
    sourceFile: string | null;
}

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const cleanText = (v: unknown, max: number) =>
    typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, "").trim().slice(0, max) : "";

/** "Pierre Bourne" -> "pierre-bourne" */
export const artistKeyOf = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * PATCH body: rename the song and/or move it to another artist.
 * At least one of the two must be given.
 */
export function validateProgressionEdit(body: any): { changes: Partial<Pick<ProgressionInput, "artist" | "artistKey" | "song">> } | { error: string } {
    if (!body || typeof body !== "object") return { error: "Request body is required." };

    const changes: Partial<Pick<ProgressionInput, "artist" | "artistKey" | "song">> = {};

    if (body.artist !== undefined) {
        const artist = cleanText(body.artist, 60);
        if (!artist || !artistKeyOf(artist)) return { error: "The artist name needs at least one letter or number." };
        changes.artist = artist;
        changes.artistKey = artistKeyOf(artist);
    }
    if (body.song !== undefined) {
        const song = cleanText(body.song, 80);
        if (!song) return { error: "The song name can't be empty." };
        changes.song = song;
    }

    if (!Object.keys(changes).length) return { error: "Nothing to change: send a new song and/or artist." };
    return { changes };
}

export function validateProgression(body: any): { progression: ProgressionInput } | { error: string } {
    if (!body || typeof body !== "object") return { error: "Request body is required." };

    const artist = cleanText(body.artist, 60);
    const song = cleanText(body.song, 80);
    const sourceFile = cleanText(body.sourceFile, 120) || null;

    if (!artist) return { error: "An artist name is required." };
    if (!artistKeyOf(artist)) return { error: "The artist name needs at least one letter or number." };
    if (!song) return { error: "A song name is required." };
    if (!ROOTS.includes(body.keyRoot)) return { error: "keyRoot must be a note name like C, F# or Bb." };
    if (!SCALES.includes(body.scale)) return { error: "scale is not one the Chord Builder knows." };

    const bpm = body.bpm;
    if (typeof bpm !== "number" || !Number.isFinite(bpm) || bpm < 40 || bpm > 200) {
        return { error: "bpm must be between 40 and 200." };
    }

    const chords = body.chords;
    if (!Array.isArray(chords) || chords.length === 0) return { error: "chords must be a non-empty array." };
    if (chords.length > MAX_CHORDS) return { error: `A progression can have at most ${MAX_CHORDS} chords.` };

    const clean: StoredChord[] = [];
    for (const [i, chord] of chords.entries()) {
        const { start, beats, notes } = chord ?? {};
        if (!isInt(start) || start < 0 || !isInt(beats) || beats < 1 || start + beats > MAX_TOTAL_BEATS) {
            return { error: `Chord ${i + 1} has an invalid position or length.` };
        }
        if (!Array.isArray(notes) || notes.length === 0 || notes.length > MAX_NOTES_PER_CHORD) {
            return { error: `Chord ${i + 1} must have 1-${MAX_NOTES_PER_CHORD} notes.` };
        }
        if (!notes.every((n: unknown) => isInt(n) && n >= 0 && n <= 127)) {
            return { error: `Chord ${i + 1} has a note outside the MIDI range (0-127).` };
        }
        clean.push({ start, beats, notes: [...new Set<number>(notes)].sort((a, b) => a - b) });
    }

    return {
        progression: {
            artist,
            artistKey: artistKeyOf(artist),
            song,
            keyRoot: body.keyRoot,
            scale: body.scale,
            bpm: Math.round(bpm),
            chords: clean,
            sourceFile,
        },
    };
}
