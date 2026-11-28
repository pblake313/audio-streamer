// Keeps audio links working past their one-hour lifetime.
//
// The backend signs every MP3/WAV link for an hour (Google Cloud V4 signed
// URLs). Each link carries its own signing time (X-Goog-Date) and lifetime
// (X-Goog-Expires), so we can tell when one is about to stop working and ask
// for a fresh one (GET /secure/beats/get-beat/:id) instead of failing.

import { get } from "svelte/store";
import type { Beat } from "../../lib/types/Beats";
import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
import { updateBeatInArray } from "./BeatsStore";
import { selectedBeat } from "./selectedBeatStore";

// refresh a link this long before it actually expires
const EXPIRY_MARGIN_MS = 2 * 60 * 1000;

/** When a signed link stops working (ms since epoch), or null if it isn't a signed link. */
export function signedUrlExpiresAt(url: string | null | undefined): number | null {
    if (!url) return null;

    try {
        const params = new URL(url).searchParams;
        const date = params.get("X-Goog-Date"); // e.g. 20261127T153000Z
        const lifetime = Number(params.get("X-Goog-Expires")); // seconds
        if (!date || !Number.isFinite(lifetime)) return null;

        const match = date.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
        if (!match) return null;
        const [, y, mo, d, h, mi, s] = match.map(Number);

        return Date.UTC(y, mo - 1, d, h, mi, s) + lifetime * 1000;
    } catch {
        return null;
    }
}

/** True when a signed link has expired, or will within the next couple of minutes. */
export function isLinkExpiring(url: string | null | undefined, marginMs = EXPIRY_MARGIN_MS): boolean {
    const expiresAt = signedUrlExpiresAt(url);
    return expiresAt !== null && expiresAt - Date.now() < marginMs;
}

// one request per track at a time, however many callers ask
const inFlight = new Map<string, Promise<Beat | null>>();

/**
 * Fetches freshly signed audio links for a track and stores them (in the
 * track list and, if it's the selected track, there too). Only the links are
 * replaced, so nothing else about the track changes. Null if it fails.
 */
export function refreshBeatUrls(beat: Beat): Promise<Beat | null> {
    const existing = inFlight.get(beat.id);
    if (existing) return existing;

    const request = (async () => {
        try {
            const response = await authorizedFetch<{ beat: Beat }>(`/secure/beats/get-beat/${beat.id}`);
            const fresh = response?.beat;
            if (!fresh) return null;

            // keep the newest local copy of the track; just swap in the new links
            const current = get(selectedBeat)?.id === beat.id ? get(selectedBeat)! : beat;
            const updated: Beat = { ...current, mp3Url: fresh.mp3Url, wavUrl: fresh.wavUrl };

            updateBeatInArray(updated);
            if (get(selectedBeat)?.id === beat.id) selectedBeat.set(updated);

            return updated;
        } catch (error) {
            console.debug("Couldn't refresh audio links:", error);
            return null;
        } finally {
            inFlight.delete(beat.id);
        }
    })();

    inFlight.set(beat.id, request);
    return request;
}
