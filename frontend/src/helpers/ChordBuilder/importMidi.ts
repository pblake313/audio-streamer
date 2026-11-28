// Reads a Standard MIDI File in the browser and turns it into chord-builder
// chords: tempo from the file, notes grouped into chords beat by beat, and a
// best-guess key. No upload: the file never leaves the browser.

import { BEATS_PER_BAR, MAX_NOTE, ROOTS, SCALES, detectChord, type Chord, type Root, type ScaleId } from "./chords";

type MidiNote = { pitch: number; start: number; end: number }; // start/end in beats

type ParsedMidi = { bpm: number | null; notes: MidiNote[] };

/** Minimal SMF parser: tempo + note on/off from every track (drums on channel 10 skipped). */
export function parseMidi(buffer: ArrayBuffer): ParsedMidi {
    const data = new DataView(buffer);
    let pos = 0;

    const str = (len: number) => {
        let s = "";
        for (let i = 0; i < len; i++) s += String.fromCharCode(data.getUint8(pos + i));
        pos += len;
        return s;
    };
    const u8 = () => data.getUint8(pos++);
    const u16 = () => {
        const v = data.getUint16(pos);
        pos += 2;
        return v;
    };
    const u32 = () => {
        const v = data.getUint32(pos);
        pos += 4;
        return v;
    };
    const varLen = () => {
        let value = 0;
        let byte;
        do {
            byte = u8();
            value = (value << 7) | (byte & 0x7f);
        } while (byte & 0x80);
        return value;
    };

    if (buffer.byteLength < 14 || str(4) !== "MThd") throw new Error("That isn't a MIDI file.");
    const headerLength = u32();
    u16(); // format (0, 1 or 2): all handled the same way here
    const trackCount = u16();
    const division = u16();
    pos = 8 + headerLength;

    if (division & 0x8000) throw new Error("This MIDI file uses SMPTE timing, which isn't supported.");
    const ticksPerBeat = division;

    let bpm: number | null = null;
    const notes: MidiNote[] = [];

    for (let t = 0; t < trackCount && pos < buffer.byteLength; t++) {
        if (str(4) !== "MTrk") throw new Error("This MIDI file looks damaged (missing track).");
        const length = u32(); // read first: `pos` must be past the length field
        const end = pos + length;
        let tick = 0;
        let status = 0;
        const open = new Map<string, number>(); // "channel:pitch" -> start tick

        while (pos < end) {
            tick += varLen();
            let byte = u8();

            if (byte === 0xff) {
                const type = u8();
                const len = varLen();
                if (type === 0x51 && len === 3 && bpm === null) {
                    const micros = (data.getUint8(pos) << 16) | (data.getUint8(pos + 1) << 8) | data.getUint8(pos + 2);
                    bpm = 60_000_000 / micros;
                }
                pos += len;
                continue;
            }
            if (byte === 0xf0 || byte === 0xf7) {
                pos += varLen(); // sysex
                continue;
            }

            // running status: a data byte reuses the previous status
            if (byte < 0x80) {
                pos--;
                byte = status;
            } else {
                status = byte;
            }

            const kind = byte & 0xf0;
            const channel = byte & 0x0f;

            if (kind === 0x90 || kind === 0x80) {
                const pitch = u8();
                const velocity = u8();
                const id = `${channel}:${pitch}`;
                if (kind === 0x90 && velocity > 0) {
                    open.set(id, tick);
                } else if (open.has(id)) {
                    if (channel !== 9) {
                        notes.push({ pitch, start: open.get(id)! / ticksPerBeat, end: tick / ticksPerBeat });
                    }
                    open.delete(id);
                }
            } else if (kind === 0xc0 || kind === 0xd0) {
                pos += 1;
            } else {
                pos += 2; // aftertouch, control change, pitch bend
            }
        }
        pos = end;
    }

    return { bpm, notes };
}

/** Pulls a note into the piano roll's range (C1 up to MAX_NOTE) by octaves. */
const fitRange = (pitch: number) => {
    while (pitch > MAX_NOTE) pitch -= 12;
    while (pitch < 24) pitch += 12;
    return pitch;
};

/**
 * Best-guess key: the major or minor scale that covers the most note time,
 * leaning toward the first chord's bass note (major keys and their relative
 * minors share every note, so this tie-break matters most).
 * It's only a guess: short loops often never play the home chord, so the
 * user is told to check it. Tested on 27 transcribed loops: 17 right.
 */
function guessKey(notes: MidiNote[]): { keyRoot: Root; scale: ScaleId } {
    const weight = new Array(12).fill(0);
    for (const n of notes) weight[n.pitch % 12] += n.end - n.start;
    const total = weight.reduce((a, b) => a + b, 0) || 1;

    const firstStart = Math.min(...notes.map((n) => n.start));
    const firstBass = Math.min(...notes.filter((n) => n.start - firstStart < 0.5).map((n) => n.pitch)) % 12;

    let best = { keyRoot: "C" as Root, scale: "major" as ScaleId, score: -Infinity };
    for (let root = 0; root < 12; root++) {
        for (const scale of ["minor", "major"] as const) {
            const fit = SCALES[scale].intervals.reduce((sum, i) => sum + weight[(root + i) % 12], 0) / total;
            const score = fit + (root === firstBass ? 0.3 : 0);
            if (score > best.score) best = { keyRoot: ROOTS[root], scale, score };
        }
    }
    return { keyRoot: best.keyRoot, scale: best.scale };
}

const BAR_CHOICES = [2, 4, 8, 12] as const;

export type ImportResult = {
    bpm: number;
    bars: (typeof BAR_CHOICES)[number];
    keyRoot: Root;
    scale: ScaleId;
    chords: Chord[];
    trimmed: boolean; // the file was longer than 12 bars and got cut
};

/** Turns a MIDI file into chords, one per held set of notes, on the beat grid. */
export function midiToChords(parsed: ParsedMidi): ImportResult {
    const notes = parsed.notes.filter((n) => n.end > n.start);
    if (!notes.length) throw new Error("No notes found in that MIDI file.");

    // start at the first note, so a file with lead-in silence still lines up
    const offset = Math.floor(Math.min(...notes.map((n) => n.start)));
    const shifted = notes.map((n) => ({ ...n, start: n.start - offset, end: n.end - offset }));

    const lastBeat = Math.ceil(Math.max(...shifted.map((n) => n.end)) - 0.01);
    const maxBeats = 12 * BEATS_PER_BAR;
    const totalBeats = Math.min(lastBeat, maxBeats);

    // the notes held during each beat (at least a third of it, to skip ghost overlaps)
    const beatSets: number[][] = [];
    for (let beat = 0; beat < totalBeats; beat++) {
        const held = shifted
            .filter((n) => Math.min(n.end, beat + 1) - Math.max(n.start, beat) >= 0.33)
            .map((n) => fitRange(n.pitch));
        beatSets.push([...new Set(held)].sort((a, b) => a - b));
    }

    // merge runs of beats with the same notes into one chord; empty beats are rests
    const chords: Chord[] = [];
    let beat = 0;
    while (beat < beatSets.length) {
        const set = beatSets[beat];
        let length = 1;
        while (beat + length < beatSets.length && beatSets[beat + length].join() === set.join()) length++;

        if (set.length) {
            const detected = detectChord(set);
            chords.push({
                root: detected?.root ?? ROOTS[set[0] % 12],
                quality: detected?.quality ?? (set.length === 1 ? "1" : ""),
                start: beat,
                beats: length,
                notes: set, // the exact notes from the file; the name comes from them
                slashBass: null,
            });
        }
        beat += length;
    }

    if (!chords.length) throw new Error("Couldn't find any held notes to turn into chords.");

    const bars = BAR_CHOICES.find((b) => b * BEATS_PER_BAR >= totalBeats) ?? 12;
    const bpm = Math.round(Math.min(200, Math.max(40, parsed.bpm ?? 120)));

    return { bpm, bars, ...guessKey(shifted), chords, trimmed: lastBeat > maxBeats };
}

export async function importMidiFile(file: File): Promise<ImportResult> {
    if (file.size > 2 * 1024 * 1024) throw new Error("That file is too big for a MIDI file (over 2 MB).");
    return midiToChords(parseMidi(await file.arrayBuffer()));
}
