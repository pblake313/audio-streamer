import type { MidiSong } from "../helpers/midiWriter";

// limits keep requests small and the generated file sane
const MAX_CHORDS = 64;
const MAX_NOTES_PER_CHORD = 12;
const MAX_TOTAL_BEATS = 256;
const MAX_NAME_LENGTH = 40;

const isInt = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value);

/**
 * Checks the body of POST /secure/midi/export and returns a clean song,
 * or an error message describing the first problem found.
 */
export function validateMidiExport(body: any): { song: MidiSong } | { error: string } {
    if (!body || typeof body !== "object") return { error: "Request body is required." };

    const { bpm, chords, title } = body;

    if (typeof bpm !== "number" || !Number.isFinite(bpm) || bpm < 20 || bpm > 300) {
        return { error: "bpm must be a number between 20 and 300." };
    }

    if (!Array.isArray(chords) || chords.length === 0) return { error: "chords must be a non-empty array." };
    if (chords.length > MAX_CHORDS) return { error: `A progression can have at most ${MAX_CHORDS} chords.` };

    const clean: MidiSong["chords"] = [];

    for (const [i, chord] of chords.entries()) {
        if (!chord || typeof chord !== "object") return { error: `Chord ${i + 1} is invalid.` };

        const { start, beats, notes, name } = chord;

        if (!isInt(start) || start < 0 || start >= MAX_TOTAL_BEATS) {
            return { error: `Chord ${i + 1} has an invalid start.` };
        }
        if (!isInt(beats) || beats < 1 || start + beats > MAX_TOTAL_BEATS) {
            return { error: `Chord ${i + 1} has an invalid length.` };
        }
        if (!Array.isArray(notes) || notes.length === 0 || notes.length > MAX_NOTES_PER_CHORD) {
            return { error: `Chord ${i + 1} must have 1-${MAX_NOTES_PER_CHORD} notes.` };
        }
        if (!notes.every((n: unknown) => isInt(n) && n >= 0 && n <= 127)) {
            return { error: `Chord ${i + 1} has a note outside the MIDI range (0-127).` };
        }
        if (name !== undefined && (typeof name !== "string" || name.length > MAX_NAME_LENGTH)) {
            return { error: `Chord ${i + 1} has an invalid name.` };
        }

        clean.push({ start, beats, notes: [...new Set<number>(notes)], name });
    }

    if (title !== undefined && (typeof title !== "string" || title.length > 80)) {
        return { error: "title must be a string of at most 80 characters." };
    }

    return { song: { bpm, chords: clean, title } };
}
