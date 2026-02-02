// src/stores/AudioPlayer/selectedBeatStore.ts
import { get, writable } from "svelte/store";
import type { Beat } from "../../lib/types/Beats";
import { audioPlayerUrl } from "../AudioPlayerStore";
import { beats } from "./beatArrayStore";
import { getAuthenticatedUser } from "../../helpers/Auth/authFunctions";

const selectedBeat = writable<Beat | null>(null);

// -----------------------
// Preload manager
// -----------------------
type PreloadEntry = {
    controller: AbortController;
    promise: Promise<void>;
    completedAt?: number;
};

const preloadMap = new Map<string, PreloadEntry>();

// tweak these
const PRELOAD_RANGE_BYTES = 256 * 1024; // 256KB (try 512KB or 1MB if you want)
const PRELOAD_TTL_MS = 2 * 60 * 1000;   // don't re-preload same beat within 2 min

function cleanupOldPreloads() {
    const now = Date.now();
    for (const [id, entry] of preloadMap.entries()) {
        if (entry.completedAt && now - entry.completedAt > PRELOAD_TTL_MS) {
            preloadMap.delete(id);
        }
    }
}

function abortAllInFlightPreloads() {
    for (const entry of preloadMap.values()) {
        // abort any that haven't completed yet
        if (!entry.completedAt) entry.controller.abort();
    }
}

function getBeatIndex(all: Beat[], current: Beat | null) {
    if (!current) return -1;
    return all.findIndex((b) => b.id === current.id);
}

function getNeighbors(all: Beat[], current: Beat | null) {
    if (!all.length) return { prev: null as Beat | null, next: null as Beat | null };

    if (!current) {
        // if nothing selected, "neighbors" doesn't really matter
        return { prev: all[all.length - 1], next: all[0] };
    }

    const idx = getBeatIndex(all, current);
    if (idx === -1) return { prev: all[all.length - 1], next: all[0] };

    const next = all[(idx + 1) % all.length];
    const prev = all[(idx - 1 + all.length) % all.length];
    return { prev, next };
}

async function preloadBeat(beat: Beat | null) {
    if (!beat?.id) return;

    cleanupOldPreloads();

    const existing = preloadMap.get(beat.id);
    if (existing) {
        // if completed recently, skip; if in-flight, reuse promise
        if (existing.completedAt && Date.now() - existing.completedAt < PRELOAD_TTL_MS) return;
        if (!existing.completedAt) return existing.promise;
    }

    // NOTE: if your auth refresh is cheap, this is fine.
    // If it's expensive, you can debounce it or call it once before preloading both.
    const controller = new AbortController();

    const p = (async () => {
        try {
            await getAuthenticatedUser(); // refresh token/cookie before hitting the stream

            const url = beat.mp3previewUrl;
            if (!url) return;

            const end = PRELOAD_RANGE_BYTES - 1;

            const res = await fetch(url, {
                method: "GET",
                signal: controller.signal,
                mode: "cors",
                credentials: "omit",   // ✅ important
                headers: {
                    Range: `bytes=0-${end}`,
                },
            });

            // Some servers might ignore Range and return 200/full body.
            // We still want to avoid downloading a huge file:
            if (!res.ok) return;

            // Consume only a small amount and then stop.
            // If Range is honored, body is already small.
            // If Range isn't honored, we still don't want to stream forever:
            const reader = res.body?.getReader();
            if (!reader) return;

            let received = 0;
            while (received < PRELOAD_RANGE_BYTES) {
                const { done, value } = await reader.read();
                if (done) break;
                received += value?.byteLength ?? 0;
            }

            // Cancel remaining data (important if server ignored Range)
            try { await reader.cancel(); } catch { }
        } catch (err: any) {
            // AbortError is expected during fast skipping
            if (err?.name !== "AbortError") {
                console.debug("preloadBeat failed:", err);
            }
        } finally {
            const entry = preloadMap.get(beat.id);
            if (entry) entry.completedAt = Date.now();
        }
    })();

    preloadMap.set(beat.id, { controller, promise: p });

    return p;
}

export async function preloadNeighbors() {
    const all = get(beats);
    const current = get(selectedBeat);
    if (!all.length) return;

    // cancel old in-flight preloads (user is skipping)
    abortAllInFlightPreloads();

    const { prev, next } = getNeighbors(all, current);

    // Authenticate once, then preload both (saves a call if getAuthenticatedUser is heavy)
    try {
        await getAuthenticatedUser();
    } catch {
        return;
    }

    // Warm cache for both (fire-and-forget)
    void preloadBeat(prev);
    void preloadBeat(next);
}

// -----------------------
// Selection / URL logic
// -----------------------
function selectNewBeat(beat: Beat) {
    selectedBeat.set(beat);
    void setAudioUrl(beat);

    // Preload neighbors after selecting a new beat
    // (don’t await; keep UI snappy)
    void preloadNeighbors();
}

export async function setAudioUrl(beat: Beat) {
    try {
        await getAuthenticatedUser();
        audioPlayerUrl.set(beat.mp3previewUrl);
    } catch (err) {
        console.error("Failed to authenticate before setting audio URL:", err);
        audioPlayerUrl.set(null);
    }
}

function selectNextBeat() {
    const allBeats = get(beats);
    const currentBeat = get(selectedBeat);
    if (!allBeats?.length) return;

    if (!currentBeat) {
        selectNewBeat(allBeats[0]);
        return;
    }

    const currentIndex = allBeats.findIndex((b) => b.id === currentBeat.id);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % allBeats.length;
    selectNewBeat(allBeats[nextIndex]);
}

function selectPreviousBeat() {
    const allBeats = get(beats);
    const currentBeat = get(selectedBeat);
    if (!allBeats?.length) return;

    if (!currentBeat) {
        selectNewBeat(allBeats[allBeats.length - 1]);
        return;
    }

    const currentIndex = allBeats.findIndex((b) => b.id === currentBeat.id);
    const prevIndex =
        currentIndex === -1
            ? allBeats.length - 1
            : (currentIndex - 1 + allBeats.length) % allBeats.length;

    selectNewBeat(allBeats[prevIndex]);
}

export { selectedBeat, selectNewBeat, selectNextBeat, selectPreviousBeat };
