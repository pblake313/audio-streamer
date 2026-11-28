// Saved progressions (the MIDI library). Every call goes through
// authorizedFetch to /secure/midi/..., so it runs through the backend's login
// middleware: only logged-in users can store or fetch anything.

import { authorizedFetch } from "../Fetchers/authorizedFetch";
import type { Root, ScaleId } from "./chords";

export type SavedChord = { start: number; beats: number; notes: number[] };

export type SavedProgression = {
    id: string;
    artist: string;
    artistKey: string;
    song: string;
    keyRoot: Root;
    scale: ScaleId;
    bpm: number;
    chords: SavedChord[];
    sourceFile: string | null;
    createdAt: number;
};

export type NewProgression = Omit<SavedProgression, "id" | "artistKey" | "createdAt">;

const BASE = "/secure/midi/progressions";

/** Every saved progression, or just one artist's. */
export async function fetchProgressions(artist?: string): Promise<SavedProgression[]> {
    const query = artist ? `?artist=${encodeURIComponent(artist)}` : "";
    const res = await authorizedFetch<{ progressions: SavedProgression[] }>(`${BASE}${query}`);
    return res.progressions ?? [];
}

export async function saveProgression(progression: NewProgression): Promise<SavedProgression> {
    const res = await authorizedFetch<{ progression: SavedProgression }>(BASE, {
        method: "POST",
        body: JSON.stringify(progression),
    });
    return res.progression;
}

/** Rename the song and/or move it to another artist. */
export async function editProgression(id: string, changes: { song?: string; artist?: string }) {
    await authorizedFetch(`${BASE}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
    });
}

export async function deleteProgression(id: string) {
    await authorizedFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** "Pierre Bourne" -> "pierre-bourne" (same rule as the backend) */
export const artistKeyOf = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
