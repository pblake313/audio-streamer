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
    searchActive,
} from "./AudioPlayer/BeatsStore";
import { resetABTester, trackA, trackB } from "./ABTestStore";
import {
    getBeatAudioSource,
    preferredAudioFormat,
    type AudioFormat,
} from "./AudioFormatStore";

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

        // start from the tracks currently visible in the list
        const currentBeats = get(filteredBeats);

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

export function setAudioMode(mode: AudioMode) {
    if (get(audioMode) === mode) return;

    toggleAudioMode();
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

// =========================
// WAV / MP3 switching
// =========================
/*
 * Switching formats mid-track loads the other file, then jumps back to
 * the same spot (and keeps playing if it was) once it's ready. The URL
 * is stored with the resume point so a different track loading in the
 * meantime doesn't inherit it.
 */
let pendingResume: { url: string; time: number; play: boolean } | null = null;

export function setAudioFormat(format: AudioFormat) {
    preferredAudioFormat.set(format);

    const beat = get(selectedBeat);
    const a = get(audioStore);
    if (!beat || !a) return;

    const source = getBeatAudioSource(beat, format);
    if (!source || source.url === get(audioPlayerUrl)) return;

    pendingResume = {
        url: source.url,
        time: a.currentTime || 0,
        play: !a.paused && !a.ended,
    };

    audioPlayerUrl.set(source.url);
}

// Timeout-related stores
export const trackTimer = writable<number>(0);
export const inTimeout = writable<boolean>(false);

// Internal helper for accumulating time
let lastAudioTime = 0;


// =========================
// Shuffle / repeat
// =========================
// The playlist always wraps back to the first track at the end.
// Loop on repeats the current track over and over instead.
const LOOP_KEY = "audioPlayer.loopTrack";
const OLD_REPEAT_KEY = "audioPlayer.repeatMode"; // earlier 3-way setting

function readSetting(key: string): string | null {
    try {
        return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
        return null;
    }
}

function writeSetting(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // storage unavailable (private mode etc.) — setting just won't persist
    }
}

const storedLoop = readSetting(LOOP_KEY);

// carry over an old "repeat one" choice; off by default
export const loopTrack = writable<boolean>(
    storedLoop !== null
        ? storedLoop === "true"
        : readSetting(OLD_REPEAT_KEY) === "one"
);

// always starts off; not remembered between visits
export const shuffleEnabled = writable<boolean>(false);

loopTrack.subscribe((on) => writeSetting(LOOP_KEY, String(on)));

export function toggleLoopTrack() {
    loopTrack.update((on) => !on);
}

/*
 * Track ids played while shuffling, oldest first. Used to avoid repeats
 * until every loaded track has played, and to walk back on "previous".
 */
let shuffleHistory: string[] = [];

export function toggleShuffle() {
    shuffleEnabled.update((on) => !on);
    shuffleHistory = [];
}

/*
 * Picks a random loaded track that hasn't played yet this shuffle cycle.
 * Shuffles across the tracks loaded so far (pagination keeps adding more
 * as the list is scrolled).
 */
function pickShuffleTrack(): Beat | null {
    const allTracks = get(filteredBeats);
    const current = get(selectedBeat);

    const others = allTracks.filter((beat) => beat.id !== current?.id);
    if (others.length === 0) return null;

    let candidates = others.filter((beat) => !shuffleHistory.includes(beat.id));

    // every loaded track has played: start a fresh cycle
    if (candidates.length === 0) {
        shuffleHistory = current ? [current.id] : [];
        candidates = others;
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
}

function rememberShuffled(beat: Beat | null | undefined) {
    if (!beat) return;
    shuffleHistory = shuffleHistory.filter((id) => id !== beat.id);
    shuffleHistory.push(beat.id);
}


// =========================
// Active playlist helpers
// =========================
function activePlaylistIsFullyFetched(): boolean {
    // search results are all loaded at once, so the playlist is complete
    if (get(searchActive)) {
        return true;
    }

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

    if (get(shuffleEnabled)) {
        const next = pickShuffleTrack();

        if (next) {
            rememberShuffled(current);
            rememberShuffled(next);
            selectPlaylistBeat(next, shouldAutoPlay);
            return;
        }
    }

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

    if (get(shuffleEnabled)) {
        // drop the current track, then go back to whatever played before it
        shuffleHistory = shuffleHistory.filter((id) => id !== current?.id);
        const previousId = shuffleHistory[shuffleHistory.length - 1];
        const previous = allTracks.find((beat) => beat.id === previousId);

        if (previous) {
            selectPlaylistBeat(previous, shouldAutoPlay);
            return;
        }
    }

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

    // finish a WAV / MP3 switch: same spot, same play state
    audio.addEventListener("loadedmetadata", () => {
        if (!audio || !pendingResume) return;

        const resume = pendingResume;
        pendingResume = null;

        // a different track was picked before this one finished loading
        if (get(audioPlayerUrl) !== resume.url) return;

        if (resume.time > 0) {
            audio.currentTime = Number.isFinite(audio.duration)
                ? Math.min(resume.time, audio.duration)
                : resume.time;
        }

        if (resume.play) {
            autoPlayTrack();
        }
    });

    audio.addEventListener("canplay", () => {
        clearAudioPlayerErrorMessage();

        // Do not force Idle if autoplay is waiting to fire.
        if (get(useAutoPlay)) return;

        // Do not force Idle if audio is already playing.
        if (!audio?.paused) return;

        // paused mid-track (e.g. after a WAV / MP3 switch) is Paused, not Idle
        audioPlayerState.set(audio.currentTime > 0 ? "Paused" : "Idle");
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

        if (get(loopTrack)) {
            restartTrack();
            return;
        }

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
