// Sends the progression to the backend, which builds the .mid file.
// It goes through POST /secure/midi/export, so it runs through the same
// secureMiddleWare (access token + IP check, token refresh) as every other
// logged-in request; only signed-in users can download MIDI.

import { authorizedFetch } from "../Fetchers/authorizedFetch";
import { chordLabel, effectiveNotes, type Chord } from "./chords";

export async function downloadMidi(args: {
    chords: Chord[];
    totalBeats: number;
    bpm: number;
}) {
    const { chords, totalBeats, bpm } = args;

    // only what's inside the loop, clipped at its end, in time order
    const inLoop = chords.filter((c) => c.start < totalBeats).sort((a, b) => a.start - b.start);

    // named after the chords: "B - Ebm7 - F# - E" (slash chords read "C over E",
    // since "/" can't go in a file name)
    const title = inLoop.map((c) => chordLabel(c).replace("/", " over ")).join(" - ");

    const payload = {
        bpm,
        // the MIDI track name has an 80-character limit on the backend
        title: title.length > 80 ? `${title.slice(0, 79)}…` : title,
        chords: inLoop
            .map((c) => ({
                start: c.start,
                beats: Math.min(c.beats, totalBeats - c.start),
                notes: c.notes && c.notes.length ? [...c.notes] : effectiveNotes(c),
                name: chordLabel(c),
            })),
    };

    if (!payload.chords.length) throw new Error("Add a chord before exporting.");

    const blob = await authorizedFetch<Blob>("/secure/midi/export", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "chord-progression"}.mid`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
