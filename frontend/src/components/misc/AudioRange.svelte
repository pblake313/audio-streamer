<script lang="ts">
    import { fade } from "svelte/transition";
    import { onDestroy } from "svelte";
    import {
        audioPlayerState,
        resetTrackTimer,
        userTapped,
    } from "../../stores/AudioPlayerStore";
    import { formatTime } from "../../helpers/formatters";
    import AudioLoader from "../loaders/AudioLoader.svelte";
    import SeekableWavForm from "./SeekableWavForm.svelte";

    /**
     * The audio element controlled by this range.
     *
     * It starts as undefined because bind:this is not populated
     * until the parent component mounts.
     */
    export let audio: HTMLAudioElement | undefined = undefined;

    /** Whether the progress bar should have rounded edges */
    export let roundedEdges: boolean = true;

    export let showTrackTime: boolean = true;

    export let useWaveForm: boolean = false;

    export let waveHeight: number = 60;

    let currentTime = 0;
    let duration = 0;
    let waveformUrl = "";

    let rangeInput: HTMLInputElement;

    let isSeeking = false;

    /**
     * Tracks the audio element that currently has listeners attached.
     */
    let connectedAudio: HTMLAudioElement | null = null;

    $: waveformPlayedColor = "#f7f7f7";
    $: waveformBaseColor = "#f7f7f736";

    $: showInitialLoader =
        $audioPlayerState === "Loading" &&
        duration <= 0 &&
        !isSeeking;

    function updateAudioState() {
        if (!connectedAudio) {
            currentTime = 0;
            duration = 0;
            waveformUrl = "";
            return;
        }

        /*
         * Do not allow timeupdate to fight the range input
         * while the user is dragging.
         */
        if (!isSeeking) {
            currentTime = Number.isFinite(
                connectedAudio.currentTime,
            )
                ? connectedAudio.currentTime
                : 0;
        }

        /*
         * Do not wipe out a valid duration during a seek.
         */
        if (
            Number.isFinite(connectedAudio.duration) &&
            connectedAudio.duration > 0
        ) {
            duration = connectedAudio.duration;
        }

        waveformUrl =
            connectedAudio.currentSrc ||
            connectedAudio.src ||
            "";
    }

    function handleLoadStart() {
        if (!connectedAudio) return;

        waveformUrl =
            connectedAudio.currentSrc ||
            connectedAudio.src ||
            "";

        /*
         * A genuine new track load should reset the range.
         * Seeking an existing track should not.
         */
        if (!isSeeking) {
            currentTime = 0;
            duration = 0;
        }
    }

    function handleEmptied() {
        if (isSeeking) return;

        currentTime = 0;
        duration = 0;
        waveformUrl = "";
    }

    function disconnectAudio() {
        if (!connectedAudio) return;

        connectedAudio.removeEventListener(
            "timeupdate",
            updateAudioState,
        );

        connectedAudio.removeEventListener(
            "loadedmetadata",
            updateAudioState,
        );

        connectedAudio.removeEventListener(
            "durationchange",
            updateAudioState,
        );

        connectedAudio.removeEventListener(
            "loadstart",
            handleLoadStart,
        );

        connectedAudio.removeEventListener(
            "emptied",
            handleEmptied,
        );

        connectedAudio = null;
    }

    function connectAudio(
        nextAudio: HTMLAudioElement | undefined,
    ) {
        if (connectedAudio === nextAudio) return;

        disconnectAudio();

        if (!nextAudio) {
            currentTime = 0;
            duration = 0;
            waveformUrl = "";
            return;
        }

        connectedAudio = nextAudio;

        connectedAudio.addEventListener(
            "timeupdate",
            updateAudioState,
        );

        connectedAudio.addEventListener(
            "loadedmetadata",
            updateAudioState,
        );

        connectedAudio.addEventListener(
            "durationchange",
            updateAudioState,
        );

        connectedAudio.addEventListener(
            "loadstart",
            handleLoadStart,
        );

        connectedAudio.addEventListener(
            "emptied",
            handleEmptied,
        );

        updateAudioState();
    }

    /*
     * Reconnect the event listeners whenever the parent passes
     * a different audio element.
     */
    $: connectAudio(audio);

    function startSeeking(event: PointerEvent) {
        if (!connectedAudio || duration <= 0) return;

        isSeeking = true;

        resetTrackTimer();

        const input = event.currentTarget as HTMLInputElement;

        try {
            input.setPointerCapture(event.pointerId);
        } catch {
            /*
             * Pointer capture may already be handled by the browser.
             */
        }
    }

    function seek(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const nextTime = Number(input.value);

        if (
            !connectedAudio ||
            !Number.isFinite(nextTime)
        ) {
            return;
        }

        /*
         * Move the thumb immediately.
         */
        currentTime = nextTime;

        /*
         * Move the actual audio position.
         */
        connectedAudio.currentTime = nextTime;
    }

    function finishSeeking() {
        if (!isSeeking) return;

        isSeeking = false;

        updateAudioState();
    }

    $: {
        if (rangeInput) {
            const percentage =
                duration > 0
                    ? Math.min(
                          100,
                          Math.max(
                              0,
                              (currentTime / duration) * 100,
                          ),
                      )
                    : 0;

            rangeInput.style.setProperty(
                "--progress",
                `${percentage}%`,
            );

            rangeInput.style.setProperty(
                "--border-radius",
                roundedEdges ? "5px" : "0px",
            );
        }
    }

    onDestroy(() => {
        disconnectAudio();
    });
</script>

<svelte:window
    on:pointerup={finishSeeking}
    on:pointercancel={finishSeeking}
/>

{#if useWaveForm}
    {#if showTrackTime}
        <div class="timeFlex">
            <p>{formatTime(currentTime)}</p>
            <p>{formatTime(duration)}</p>
        </div>
    {/if}

    <SeekableWavForm
        audio={audio}
        audioUrl={waveformUrl}
        playedColor={waveformPlayedColor}
        baseColor={waveformBaseColor}
        height={waveHeight}
        zoom={1}
    />
{:else if $userTapped}
    <div
        class="wrapEntireRange"
        class:smallRange={!showTrackTime}
    >
        <div class="contentWrapper">
            <!--
                This never gets removed from the DOM.
                That is what keeps dragging functional.
            -->
            <div
                class="rangeContent"
                class:rangeContentHidden={showInitialLoader}
            >
                <div class="rangeWrapper">
                    <input
                        bind:this={rangeInput}
                        class="audioRangeInput"
                        type="range"
                        min="0"
                        max={duration}
                        step="0.01"
                        bind:value={currentTime}
                        on:pointerdown={startSeeking}
                        on:input={seek}
                        on:change={finishSeeking}
                        on:blur={finishSeeking}
                        disabled={!audio || duration <= 0}
                    />
                </div>

                {#if showTrackTime}
                    <div class="timeFlex">
                        <p>{formatTime(currentTime)}</p>
                        <p>{formatTime(duration)}</p>
                    </div>
                {/if}
            </div>

            {#if showInitialLoader}
                <div
                    in:fade={{ duration: 150 }}
                    out:fade={{ duration: 150 }}
                    class="loaderOverlay"
                >
                    <div class="wrapLoaderJ">
                        <AudioLoader
                            height="7px"
                            backgroundColor="transparent"
                        />
                    </div>
                </div>
            {/if}
        </div>
    </div>
{:else}
    <div
        class="wrapEntireRange"
        class:smallRange={!showTrackTime}
    >
        <div class="contentWrapper">
            <div class="rangeWrapper">
                <input
                    class="audioRangeInput"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value="0"
                    disabled
                />
            </div>

            {#if showTrackTime}
                <div class="timeFlex">
                    <p>0:00</p>
                    <p>0:00</p>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .wrapEntireRange {
        height: 38px;
        position: relative;
    }

    .smallRange {
        height: 7px;
    }

    .contentWrapper {
        position: absolute;
        top: 0;
        left: 0;

        width: 100%;
        height: 100%;
    }

    .rangeContent {
        width: 100%;
        height: 100%;
    }

    /*
     * Hide it visually while loading, but do not destroy it.
     */
    .rangeContentHidden {
        visibility: hidden;
        pointer-events: none;
    }

    .loaderOverlay {
        position: absolute;
        top: 0;
        left: 0;

        width: 100%;
        height: 100%;

        pointer-events: none;
    }

    .rangeWrapper {
        position: relative;

        height: 7px;
        padding: 0;
        margin: 0;
    }

    .audioRangeInput {
        position: absolute;
        top: 0;
        left: 0;

        width: 100%;
        height: 7px;

        appearance: none;
        background: transparent;

        padding: 0;
        margin: 0;

        cursor: pointer;
    }

    .audioRangeInput:disabled {
        cursor: default;
    }

    .audioRangeInput::-webkit-slider-runnable-track {
        height: 7px;

        background: linear-gradient(
            to right,
            var(--accent, #d1d1d1) var(--progress, 0%),
            var(
                    --accent-faded,
                    rgba(196, 196, 196, 0.267)
                )
                var(--progress, 0%)
        );

        border-radius: var(--border-radius, 5px);
    }

    .audioRangeInput::-webkit-slider-thumb {
        appearance: none;

        width: 12px;
        height: 12px;

        border-radius: 50%;
        background-color: white;
        border: 2px solid white;

        margin-top: -3px;

        box-shadow: 0 0 2px rgba(0, 0, 0, 0.1);
    }

    .audioRangeInput::-moz-range-track {
        height: 7px;

        background: var(
            --accent-faded,
            rgba(196, 196, 196, 0.267)
        );

        border-radius: var(--border-radius, 5px);
    }

    .audioRangeInput::-moz-range-progress {
        height: 7px;

        background: var(--accent, #d1d1d1);
        border-radius: var(--border-radius, 5px);
    }

    .audioRangeInput::-moz-range-thumb {
        width: 12px;
        height: 12px;

        border-radius: 50%;
        background-color: white;
        border: 2px solid white;

        box-shadow: 0 0 2px rgba(0, 0, 0, 0.1);

        cursor: pointer;
    }

    .timeFlex {
        display: flex;
        justify-content: space-between;
        align-items: center;

        margin-top: 10px;
    }

    .timeFlex p {
        opacity: 0.6;
        font-size: 9pt;
    }

    .wrapLoaderJ {
        height: 38px;
    }
</style>