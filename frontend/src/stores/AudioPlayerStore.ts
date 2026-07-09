import { get, writable } from "svelte/store";
import type { Beat } from "../lib/types/Beats";
import {
    preloadNeighbors,
    selectedBeat,
    selectNewBeat,
} from "./AudioPlayer/selectedBeatStore";
import {
    allBeatPagesFetched,
    allFilteredBeatPagesFetched,
    beats,
    beatPagesFetched,
    fetchBeats,
    fetchBeatsWithFilters,
    filteredBeatPagesFetched,
    filteredBeats,
    getNextBeatPageToFetch,
    getNextFilteredBeatPageToFetch,
    hasActiveBeatFilters,
} from "./AudioPlayer/BeatsStore";
import { resetABTester, trackA, trackB } from "./ABTestStore";

// How many seconds before we show the "Still Listening?" popup
const LISTEN_TIMEOUT_SECONDS = 60 * 30;

// =========================
// Audio element initialization
// =========================
let audio: HTMLAudioElement | null = null;

if (typeof Audio !== "undefined") {
    audio = new Audio();
    audio.crossOrigin = "anonymous"; // Required for visualizer to work
}

// audio mode
export type AudioMode = "abTester" | "streamer";
export const audioMode = writable<AudioMode>("streamer");

export function toggleAudioMode() {
    const currentMode = get(audioMode);

    const nextMode: AudioMode =
        currentMode === "streamer"
            ? "abTester"
            : "streamer";

    if (nextMode === "abTester") {
        // Stop the normal streamer so both players do not run together.
        stopTrack();

        const currentBeats = get(beats);

        if (currentBeats[0]) {
            trackA.set(currentBeats[0]);
        }

        if (currentBeats[1]) {
            trackB.set(currentBeats[1]);
        }
    } else {
        // Completely clear and stop the A/B tester.
        resetABTester();
    }

    audioMode.set(nextMode);
}

// streamer stores
export const audioStore = writable<HTMLAudioElement | null>(audio);

export const useAutoPlay = writable<boolean>(false);
export const audioPlayerUrl = writable<string | null>(null);

export const audioPlayerState = writable<
    | "Idle"
    | "Loading"
    | "Playing"
    | "Paused"
    | "Ended"
    | "Buffering"
    | "Error"
>("Idle");

export const audioPlayerErrorMessage = writable<string | null>(null);

export const userTapped = writable<boolean>(false);

// Timeout-related stores
export const trackTimer = writable<number>(0);
export const inTimeout = writable<boolean>(false);

// Internal helper for accumulating time
let lastAudioTime = 0;


// =========================
// Active playlist helpers
// =========================
function activePlaylistIsFullyFetched(): boolean {
    if (get(hasActiveBeatFilters)) {
        return get(allFilteredBeatPagesFetched);
    }

    return get(allBeatPagesFetched);
}


function getActivePaginationProgress(): string {
    if (get(hasActiveBeatFilters)) {
        return JSON.stringify({
            pages: get(filteredBeatPagesFetched),
            complete: get(allFilteredBeatPagesFetched),
        });
    }

    return JSON.stringify({
        pages: get(beatPagesFetched),
        complete: get(allBeatPagesFetched),
    });
}


async function fetchNextActivePlaylistPage(): Promise<void> {
    if (get(hasActiveBeatFilters)) {
        await fetchBeatsWithFilters(
            getNextFilteredBeatPageToFetch()
        );

        return;
    }

    await fetchBeats(getNextBeatPageToFetch());
}


function selectPlaylistBeat(
    beat: Beat,
    shouldAutoPlay: boolean
) {
    const current = get(selectedBeat);

    /*
     * A fully fetched playlist containing one track loops back to the same
     * track. Restart it directly because selecting the same beat may not
     * cause the audio source loader to run again.
     */
    if (current?.id === beat.id) {
        const liveAudio = get(audioStore);

        useAutoPlay.set(false);

        if (!liveAudio) return;

        liveAudio.currentTime = 0;

        if (shouldAutoPlay) {
            autoPlayTrack();
        } else {
            audioPlayerState.set("Idle");
        }

        void preloadNeighbors();
        return;
    }

    /*
     * Set this before changing selectedBeat. The selected-beat loader may
     * load and reach canplay immediately.
     */
    useAutoPlay.set(shouldAutoPlay);
    selectNewBeat(beat);

    void preloadNeighbors();
}


async function advanceToNextTrackWithPagination(
    shouldAutoPlay: boolean = false
) {
    let allTracks = get(filteredBeats);
    let current = get(selectedBeat);

    if (allTracks.length === 0) return;

    if (!current) {
        selectPlaylistBeat(allTracks[0], shouldAutoPlay);
        return;
    }

    let currentIndex = allTracks.findIndex(
        (beat) => beat.id === current?.id
    );

    if (currentIndex === -1) {
        selectPlaylistBeat(allTracks[0], shouldAutoPlay);
        return;
    }

    if (currentIndex < allTracks.length - 1) {
        selectPlaylistBeat(
            allTracks[currentIndex + 1],
            shouldAutoPlay
        );
        return;
    }

    /*
     * We are on the last currently loaded track.
     *
     * Keep fetching the active pagination source until either:
     *  - another track appears after the current track,
     *  - all relevant pages are fetched, or
     *  - a request fails to advance pagination.
     *
     * This matters because filtered requests and normal requests both upsert
     * into the same beats store, so an incoming page can occasionally contain
     * beats that were already loaded by the other pagination path.
     */
    while (!activePlaylistIsFullyFetched()) {
        const liveAudio = get(audioStore);

        if (liveAudio && !liveAudio.paused) {
            liveAudio.pause();
        }

        const progressBeforeFetch = getActivePaginationProgress();

        await fetchNextActivePlaylistPage();

        allTracks = get(filteredBeats);
        current = get(selectedBeat);

        if (allTracks.length === 0 || !current) return;

        currentIndex = allTracks.findIndex(
            (beat) => beat.id === current?.id
        );

        if (currentIndex === -1) {
            selectPlaylistBeat(allTracks[0], shouldAutoPlay);
            return;
        }

        if (currentIndex < allTracks.length - 1) {
            selectPlaylistBeat(
                allTracks[currentIndex + 1],
                shouldAutoPlay
            );
            return;
        }

        const progressAfterFetch = getActivePaginationProgress();

        if (progressAfterFetch === progressBeforeFetch) {
            // The request failed or did not advance a page. Avoid an endless loop.
            return;
        }
    }

    /*
     * We reached the end and every page for the active playlist is loaded.
     * Loop back to its first track.
     */
    allTracks = get(filteredBeats);

    if (allTracks.length > 0) {
        selectPlaylistBeat(allTracks[0], shouldAutoPlay);
    }
}


function moveToPreviousTrack(shouldAutoPlay: boolean = false) {
    const allTracks = get(filteredBeats);
    const current = get(selectedBeat);

    if (allTracks.length === 0) return;

    if (!current) {
        selectPlaylistBeat(allTracks[0], shouldAutoPlay);
        return;
    }

    const currentIndex = allTracks.findIndex(
        (beat) => beat.id === current.id
    );

    if (currentIndex === -1) {
        selectPlaylistBeat(allTracks[0], shouldAutoPlay);
        return;
    }

    if (currentIndex > 0) {
        selectPlaylistBeat(
            allTracks[currentIndex - 1],
            shouldAutoPlay
        );
        return;
    }

    /*
     * Only loop from the first track to the last when the entire active
     * playlist is known. Otherwise the true last track has not been fetched.
     */
    if (activePlaylistIsFullyFetched()) {
        selectPlaylistBeat(
            allTracks[allTracks.length - 1],
            shouldAutoPlay
        );
    }
}


// =========================
// Error helpers
// =========================
function clearAudioPlayerErrorMessage() {
    audioPlayerErrorMessage.set(null);
}


function getAudioErrorMessage(
    error: MediaError | Error | any
): string {
    if (error?.code) {
        switch (error.code) {
            case 1:
                return "Audio playback was aborted.";
            case 2:
                return "Audio failed to load. Check your connection and try again.";
            case 3:
                return "Audio file could not be decoded. It may be corrupt or unsupported.";
            case 4:
                return "Audio file is missing, private, expired, or unsupported.";
            default:
                return "Unable to load audio. Please try again.";
        }
    }

    if (error?.name === "NotAllowedError") {
        return "Playback was blocked by the browser. Tap play to start the audio.";
    }

    if (error?.name === "NotSupportedError") {
        return "This audio file type is not supported by your browser.";
    }

    return error?.message || "Unable to play audio. Please try again.";
}


function setAudioPlayerError(error: MediaError | Error | any) {
    const message = getAudioErrorMessage(error);

    audioPlayerErrorMessage.set(message);
    audioPlayerState.set("Error");

    console.error("Audio error:", error);
}


// =========================
// Audio element listeners
// =========================
if (audio) {
    audio.addEventListener("loadstart", () => {
        clearAudioPlayerErrorMessage();
        audioPlayerState.set("Loading");
    });

    audio.addEventListener("canplay", () => {
        clearAudioPlayerErrorMessage();

        // Do not force Idle if autoplay is waiting to fire.
        if (get(useAutoPlay)) return;

        // Do not force Idle if audio is already playing.
        if (!audio?.paused) return;

        audioPlayerState.set("Idle");
    });

    audio.addEventListener("playing", () => {
        clearAudioPlayerErrorMessage();
        audioPlayerState.set("Playing");

        lastAudioTime = audio?.currentTime ?? 0;
    });

    audio.addEventListener("pause", () => {
        if (!audio) return;
        if (audio.ended) return;

        if (audio.currentTime === 0) {
            audioPlayerState.set("Idle");
        } else {
            audioPlayerState.set("Paused");
        }
    });

    audio.addEventListener("seeking", () => {
        resetTrackTimer();
        lastAudioTime = audio?.currentTime ?? 0;
    });

    audio.addEventListener("ended", async () => {
        clearAudioPlayerErrorMessage();
        audioPlayerState.set("Ended");
        userTapped.set(true);

        await advanceToNextTrackWithPagination(true);
    });

    audio.addEventListener("waiting", () => {
        audioPlayerState.set("Buffering");
    });

    audio.addEventListener("error", () => {
        setAudioPlayerError(audio?.error);
    });

    audio.addEventListener("timeupdate", () => {
        const a = audio;
        if (!a) return;

        if (get(inTimeout)) return;
        if (get(audioPlayerState) !== "Playing") return;

        const currentTime = a.currentTime;
        const rawDelta = currentTime - lastAudioTime;

        if (rawDelta < 0 || rawDelta > 1.5) {
            lastAudioTime = currentTime;
            return;
        }

        const delta = Math.max(0, rawDelta);
        lastAudioTime = currentTime;

        trackTimer.update((prev) => {
            const next = prev + delta;

            if (next >= LISTEN_TIMEOUT_SECONDS) {
                const live = get(audioStore);

                if (live) {
                    live.pause();
                    audioPlayerState.set("Paused");
                }

                inTimeout.set(true);
            }

            return next;
        });
    });
}


// =========================
// Playback controls
// =========================
function playTrackInternal(resetTimer: boolean) {
    const a = get(audioStore);
    if (!a) return;

    userTapped.set(true);
    clearAudioPlayerErrorMessage();

    if (resetTimer) {
        resetTrackTimer();
    }

    a.play().catch((err: any) => {
        if (err?.name === "AbortError") {
            console.debug(
                "Play aborted due to a new load request; ignoring AbortError."
            );
            return;
        }

        setAudioPlayerError(err);
    });
}


function playTrack() {
    playTrackInternal(true);
}


function autoPlayTrack() {
    playTrackInternal(false);
}


function restartTrack() {
    const a = get(audioStore);
    if (!a) return;

    userTapped.set(true);
    clearAudioPlayerErrorMessage();
    resetTrackTimer();

    a.currentTime = 0;

    a.play().catch((err) => {
        if (err?.name === "AbortError") return;
        setAudioPlayerError(err);
    });
}


function previousTrack() {
    userTapped.set(true);
    clearAudioPlayerErrorMessage();
    resetTrackTimer();

    moveToPreviousTrack(false);
}


async function smartNextTrack() {
    const shouldAutoPlay = [
        "Playing",
        "Buffering",
        "Loading",
    ].includes(get(audioPlayerState));

    userTapped.set(true);
    clearAudioPlayerErrorMessage();
    resetTrackTimer();

    await advanceToNextTrackWithPagination(shouldAutoPlay);
}


async function nextTrack() {
    const shouldAutoPlay = [
        "Playing",
        "Buffering",
        "Loading",
    ].includes(get(audioPlayerState));

    userTapped.set(true);
    clearAudioPlayerErrorMessage();
    resetTrackTimer();

    await advanceToNextTrackWithPagination(shouldAutoPlay);
}


function pauseTrack() {
    const a = get(audioStore);

    if (a && !a.paused) {
        userTapped.set(true);
        resetTrackTimer();
        a.pause();
    }
}


function smartPreviousTrack() {
    const liveAudio = get(audioStore);
    if (!liveAudio) return;

    const shouldAutoPlay = [
        "Playing",
        "Buffering",
        "Loading",
    ].includes(get(audioPlayerState));

    userTapped.set(true);
    clearAudioPlayerErrorMessage();
    resetTrackTimer();

    if (liveAudio.currentTime > 2) {
        restartTrack();
        return;
    }

    moveToPreviousTrack(shouldAutoPlay);
}


function stopTrack() {
    const a = get(audioStore);
    if (!a) return;

    userTapped.set(true);
    clearAudioPlayerErrorMessage();

    a.pause();
    a.currentTime = 0;

    useAutoPlay.set(false);
    audioPlayerState.set("Idle");
    resetTrackTimer();
}


// =========================
// Reset timer helper
// =========================
export function resetTrackTimer() {
    trackTimer.set(0);
    inTimeout.set(false);
    lastAudioTime = audio?.currentTime ?? 0;
}


export {
    nextTrack,
    playTrack,
    autoPlayTrack,
    previousTrack,
    restartTrack,
    pauseTrack,
    smartNextTrack,
    smartPreviousTrack,
    stopTrack,
    clearAudioPlayerErrorMessage,
};
