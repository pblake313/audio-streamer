// Writes a Standard MIDI File (format 0, one track) for a chord progression.
// No dependencies: SMF is a small binary format of chunks and events.

export interface MidiChord {
    start: number; // beat position (0-based)
    beats: number; // length in beats
    notes: number[]; // MIDI note numbers (0-127)
    name?: string; // chord symbol, written as a marker (e.g. "Am7")
}

export interface MidiSong {
    bpm: number;
    chords: MidiChord[];
    title?: string;
    velocity?: number; // 1-127
}

const TICKS_PER_BEAT = 480;

/** MIDI variable-length quantity: 7 bits per byte, high bit = "more follows". */
function varLen(value: number): number[] {
    let buffer = value & 0x7f;
    const bytes: number[] = [];

    while ((value >>= 7)) {
        buffer <<= 8;
        buffer |= (value & 0x7f) | 0x80;
    }

    while (true) {
        bytes.push(buffer & 0xff);
        if (buffer & 0x80) buffer >>= 8;
        else break;
    }

    return bytes;
}

const textBytes = (text: string) => [...Buffer.from(text, "utf8")];

function metaEvent(type: number, data: number[]): number[] {
    return [0xff, type, ...varLen(data.length), ...data];
}

type TimedEvent = { tick: number; order: number; bytes: number[] };

export function buildMidiFile(song: MidiSong): Buffer {
    const velocity = Math.max(1, Math.min(127, Math.round(song.velocity ?? 90)));
    const microsPerBeat = Math.round(60_000_000 / song.bpm);

    const events: TimedEvent[] = [];

    for (const chord of song.chords) {
        const on = Math.round(chord.start * TICKS_PER_BEAT);
        const off = Math.round((chord.start + chord.beats) * TICKS_PER_BEAT);

        if (chord.name) {
            // marker with the chord symbol, shown above the clip in most DAWs
            events.push({ tick: on, order: 0, bytes: metaEvent(0x06, textBytes(chord.name)) });
        }

        for (const note of chord.notes) {
            // note-offs sort before note-ons at the same tick, so a repeated
            // note across two chords re-triggers cleanly
            events.push({ tick: off, order: 1, bytes: [0x80, note, 0] });
            events.push({ tick: on, order: 2, bytes: [0x90, note, velocity] });
        }
    }

    events.sort((a, b) => a.tick - b.tick || a.order - b.order);

    const track: number[] = [
        // header meta: name, tempo, 4/4 time, piano program
        0, ...metaEvent(0x03, textBytes(song.title || "Chord Progression")),
        0, ...metaEvent(0x51, [(microsPerBeat >> 16) & 0xff, (microsPerBeat >> 8) & 0xff, microsPerBeat & 0xff]),
        0, ...metaEvent(0x58, [4, 2, 24, 8]),
        0, 0xc0, 0, // program change: channel 1 -> acoustic grand piano
    ];

    let lastTick = 0;
    for (const event of events) {
        track.push(...varLen(event.tick - lastTick), ...event.bytes);
        lastTick = event.tick;
    }

    track.push(0, ...metaEvent(0x2f, [])); // end of track

    const header = Buffer.alloc(14);
    header.write("MThd", 0, "ascii");
    header.writeUInt32BE(6, 4);
    header.writeUInt16BE(0, 8); // format 0
    header.writeUInt16BE(1, 10); // one track
    header.writeUInt16BE(TICKS_PER_BEAT, 12);

    const trackHeader = Buffer.alloc(8);
    trackHeader.write("MTrk", 0, "ascii");
    trackHeader.writeUInt32BE(track.length, 4);

    return Buffer.concat([header, trackHeader, Buffer.from(track)]);
}
