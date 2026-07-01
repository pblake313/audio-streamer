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
export const trackTimer = writable<number>(0);
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
// Helper: Fetch more beats if needed, then advance
// =========================
async function advanceToNextTrackWithPagination(shouldAutoPlay: boolean = false) {
	const allTracks = get(beats);
	const current = get(selectedBeat);

	const isLastTrack =
		allTracks.length > 0 &&
		allTracks[allTracks.length - 1]?.id === current?.id;

	if (isLastTrack && !get(allBeatPagesFetched)) {
		const a = get(audioStore);

		if (a) {
			a.pause();
			// Do not touch currentTime here.
		}

		await fetchBeats(getNextBeatPageToFetch());
		void preloadNeighbors();
	}

	// IMPORTANT:
	// Set autoplay BEFORE selectedBeat changes.
	// Otherwise the selectedBeat reactive loader can load the src,
	// hit canplay, and settle back to Idle before autoplay is enabled.
	if (shouldAutoPlay) {
		useAutoPlay.set(true);
	}

	selectNextBeat();
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
			console.debug("Play aborted due to a new load request; ignoring AbortError.");
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
	const allTracks = get(beats);
	if (!allTracks || allTracks.length === 0) return;

	userTapped.set(true);
	clearAudioPlayerErrorMessage();
	resetTrackTimer();

	selectPreviousBeat();
}

async function smartNextTrack() {
	const shouldAutoPlay = ["Playing", "Buffering", "Loading"].includes(
		get(audioPlayerState)
	);

	userTapped.set(true);
	clearAudioPlayerErrorMessage();
	resetTrackTimer();

	await advanceToNextTrackWithPagination(shouldAutoPlay);
}

function nextTrack() {
	const shouldAutoPlay = ["Playing", "Buffering", "Loading"].includes(
		get(audioPlayerState)
	);

	userTapped.set(true);
	clearAudioPlayerErrorMessage();
	resetTrackTimer();

	if (shouldAutoPlay) {
		useAutoPlay.set(true);
	}

	selectNextBeat();
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

	const shouldAutoPlay = ["Playing", "Buffering", "Loading"].includes(
		get(audioPlayerState)
	);

	userTapped.set(true);
	clearAudioPlayerErrorMessage();
	resetTrackTimer();

	if (liveAudio.currentTime > 2) {
		restartTrack();
		return;
	}

	if (shouldAutoPlay) {
		useAutoPlay.set(true);
	}

	previousTrack();
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
	clearAudioPlayerErrorMessage
};