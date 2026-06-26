import { get, writable } from "svelte/store";
import {
	preloadNeighbors,
	selectedBeat,
	selectNextBeat,
	selectPreviousBeat
} from "./AudioPlayer/selectedBeatStore";
import {
	allBeatPagesFetched,
	beats,
	fetchBeats,
	getNextBeatPageToFetch
} from "./AudioPlayer/BeatsStore";

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

// =========================
// Stores
// =========================
export const audioStore = writable<HTMLAudioElement | null>(audio);

export const useAutoPlay = writable<boolean>(false);
export const audioPlayerUrl = writable<string | null>(null);

export const audioPlayerState = writable<
	"Idle" | "Loading" | "Playing" | "Paused" | "Ended" | "Buffering" | "Error"
>("Idle");

export const audioPlayerErrorMessage = writable<string | null>(null);

export const userTapped = writable<boolean>(false);

// Timeout-related stores
export const trackTimer = writable<number>(0); // seconds since last user activity
export const inTimeout = writable<boolean>(false);

// Internal helper for accumulating time
let lastAudioTime = 0;

// =========================
// Error helpers
// =========================
function clearAudioPlayerErrorMessage() {
	audioPlayerErrorMessage.set(null);
}

function getAudioErrorMessage(error: MediaError | Error | any): string {
	// HTMLAudioElement MediaError
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

	// play() promise errors
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
// Helper: Fetch more beats if needed, then advance to next track
// =========================
async function advanceToNextTrackWithPagination() {
	const allTracks = get(beats);
	const current = get(selectedBeat);

	const isLastTrack =
		allTracks.length > 0 &&
		allTracks[allTracks.length - 1]?.id === current?.id;

	// If last track AND more pages remain → fetch next page
	if (isLastTrack && !get(allBeatPagesFetched)) {
		const a = get(audioStore);
		if (a) {
			a.pause();
			// IMPORTANT: don't touch currentTime here, or we'll fire `seeking`
			// and reset the timeout via the seeking handler.
		}

		await fetchBeats(getNextBeatPageToFetch());
		void preloadNeighbors();
	}

	// Move to next beat regardless
	selectNextBeat();
}

// =========================
// audio element listeners
// =========================
if (audio) {
	audio.addEventListener("loadstart", () => {
		clearAudioPlayerErrorMessage();
		audioPlayerState.set("Loading");
	});

	audio.addEventListener("canplay", () => {
		clearAudioPlayerErrorMessage();
		audioPlayerState.set("Idle");
	});

	audio.addEventListener("playing", () => {
		clearAudioPlayerErrorMessage();
		audioPlayerState.set("Playing");

		// reset baseline for time tracking
		lastAudioTime = audio?.currentTime ?? 0;
	});

	audio.addEventListener("pause", () => {
		if (!audio) return;
		if (audio.ended) return;

		// If we've been "stopped" (currentTime at 0), treat this as Idle.
		if (audio.currentTime === 0) {
			audioPlayerState.set("Idle");
		} else {
			audioPlayerState.set("Paused");
		}
	});

	// When user scrubs / seeks, treat as activity & reset timeout
	audio.addEventListener("seeking", () => {
		resetTrackTimer();
		lastAudioTime = audio?.currentTime ?? 0;
	});

	// When track ends → fetch next batch if needed → advance, THEN enable autoplay
	audio.addEventListener("ended", async () => {
		clearAudioPlayerErrorMessage();
		audioPlayerState.set("Ended");
		userTapped.set(true);

		await advanceToNextTrackWithPagination();

		// auto-play the new track (no timer reset)
		useAutoPlay.set(true);
	});

	audio.addEventListener("waiting", () => {
		audioPlayerState.set("Buffering");
	});

	audio.addEventListener("error", () => {
		setAudioPlayerError(audio?.error);
	});

	// timeupdate → increment listen timer + trigger timeout
	audio.addEventListener("timeupdate", () => {
		const a = audio;
		if (!a) return;

		// If we're already in a timeout prompt, stop counting
		if (get(inTimeout)) return;

		// Only count when actively playing
		if (get(audioPlayerState) !== "Playing") return;

		const currentTime = a.currentTime;

		// Detect manual jumps / scrubs:
		// - negative delta → jumped backwards
		// - huge positive delta → likely a seek, not natural playback
		const rawDelta = currentTime - lastAudioTime;
		if (rawDelta < 0 || rawDelta > 1.5) {
			// Treat as user interaction → reset baseline, but don't add to timer
			lastAudioTime = currentTime;
			return;
		}

		const delta = Math.max(0, rawDelta);
		lastAudioTime = currentTime;

		trackTimer.update((prev) => {
			const next = prev + delta;

			if (next >= LISTEN_TIMEOUT_SECONDS) {
				// Pause but do NOT reset position
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

// Internal: shared play logic; can optionally reset timer
function playTrackInternal(resetTimer: boolean) {
	const a = get(audioStore);
	if (a) {
		userTapped.set(true);
		clearAudioPlayerErrorMessage();

		if (resetTimer) {
			resetTrackTimer(); // only for manual actions
		}

		a.play().catch((err: any) => {
            console.log(err)

			// Browsers will throw AbortError when a new load interrupts a pending play()
			// (for example, when the src changes quickly). That isn't a real failure.
			if (err?.name === "AbortError") {
				console.debug(
					"Play aborted due to a new load request; ignoring AbortError."
				);
				return;
			}

			setAudioPlayerError(err);
		});
	} else {
        
    }
}

// Manual play (buttons, "Yes" in modal, etc.)
function playTrack() {
	playTrackInternal(true);
}

// Auto play (used after auto-next / useAutoPlay, no timer reset)
function autoPlayTrack() {
	playTrackInternal(false);
}

function restartTrack() {
	const a = get(audioStore);
	if (a) {
		userTapped.set(true);
		clearAudioPlayerErrorMessage();
		resetTrackTimer(); // user action

		a.currentTime = 0;

		a.play().catch((err) => {
			setAudioPlayerError(err);
		});
	}
}

function previousTrack() {
	const allTracks = get(beats);
	if (!allTracks || allTracks.length === 0) return;

	userTapped.set(true);
	clearAudioPlayerErrorMessage();
	resetTrackTimer(); // user action

	selectPreviousBeat();
}

// smartNextTrack — paginates + sets autoplay for new track
async function smartNextTrack() {
	const isPlaying = get(audioPlayerState) === "Playing";

	userTapped.set(true);
	clearAudioPlayerErrorMessage();
	resetTrackTimer(); // user action

	await advanceToNextTrackWithPagination();

	if (isPlaying) {
		useAutoPlay.set(true);
	}
}

function nextTrack() {
	userTapped.set(true);
	clearAudioPlayerErrorMessage();
	resetTrackTimer(); // user action

	selectNextBeat();
}

function pauseTrack() {
	const a = get(audioStore);
	if (a && !a.paused) {
		userTapped.set(true);
		resetTrackTimer(); // user action
		a.pause();
	}
}

function smartPreviousTrack() {
	const liveAudio = get(audioStore);
	if (!liveAudio) return;

	const isPlaying = get(audioPlayerState) === "Playing";

	userTapped.set(true);
	clearAudioPlayerErrorMessage();
	resetTrackTimer(); // user action

	if (liveAudio.currentTime > 2) {
		restartTrack();
	} else {
		previousTrack();

		if (isPlaying) {
			useAutoPlay.set(true);
		}
	}
}

function stopTrack() {
	const a = get(audioStore);
	if (a) {
		userTapped.set(true);
		clearAudioPlayerErrorMessage();

		a.pause();
		a.currentTime = 0;

		audioPlayerState.set("Idle");
		resetTrackTimer(); // fully reset
	}
}

// Reset timer helper
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
	clearAudioPlayerErrorMessage
};