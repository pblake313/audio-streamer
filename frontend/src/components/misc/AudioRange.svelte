<script lang="ts">
    import { fade } from "svelte/transition";
    import { onDestroy } from "svelte";
    import { get } from "svelte/store";
    import {
        audioPlayerState,
        audioPlayerUrl,
        audioStore,
        resetTrackTimer,
        userTapped,
    } from "../../stores/AudioPlayerStore";
    import { formatTime } from "../../helpers/formatters";
    import AudioLoader from "../loaders/AudioLoader.svelte";
    import SeekableWavForm from "./SeekableWavForm.svelte";
    // Import your resetTrackTimer function from its module

    /** Image URL to calculate average color from */
    export let imageUrl: string | null = null;

    /** Whether the progress bar should have rounded edges */
    export let roundedEdges: boolean = true;

    export let showTrackTime: boolean = true;

    export let useWaveForm: boolean = false;
    export let waveHeight: number = 60

    let currentTime = 0;
    let duration = 0;
    let averageColor: string | null = null;
    let rangeInput: HTMLInputElement;

    $: waveformPlayedColor = averageColor ?? "#1b1b1b";
    $: waveformBaseColor = averageColor
        ? toFaded(averageColor, 0.35)
        : "rgba(50, 50, 50, 0.15)";

    function toFaded(rgb: string, alpha = 0.25) {
        return rgb.replace("rgb", "rgba").replace(")", `, ${alpha})`);
    }
    const audio = get(audioStore);

    if (audio) {
        const update = () => {
            currentTime = Math.floor(audio.currentTime);
            duration = Math.floor(audio.duration || 0);
        };

        audio.addEventListener("timeupdate", update);
        audio.addEventListener("loadedmetadata", update);

        onDestroy(() => {
            audio.removeEventListener("timeupdate", update);
            audio.removeEventListener("loadedmetadata", update);
        });
    }

    function seek(event: Event) {
        // Reset the timeout when seeking
        resetTrackTimer();
        const input = event.target as HTMLInputElement;
        if (audio) {
            audio.currentTime = parseInt(input.value);
        }
    }

    function getAverageColor(url: string) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
            );
            const data = imageData.data;

            let r = 0,
                g = 0,
                b = 0;
            const length = data.length / 4;

            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
            }

            r = Math.floor(r / length);
            g = Math.floor(g / length);
            b = Math.floor(b / length);

            // Mix with white (50%)
            r = Math.floor((r + 255) / 2);
            g = Math.floor((g + 255) / 2);
            b = Math.floor((b + 255) / 2);

            averageColor = `rgb(${r}, ${g}, ${b})`;
        };
    }

    $: if (imageUrl) {
        getAverageColor(imageUrl);
    }

    $: {
        if (rangeInput && duration > 0) {
            const percent = (currentTime / duration) * 100;
            rangeInput.style.setProperty("--progress", `${percent}%`);
            if (averageColor) {
                rangeInput.style.setProperty("--accent", averageColor);
                rangeInput.style.setProperty(
                    "--accent-faded",
                    averageColor.replace("rgb", "rgba").replace(")", ", 0.3)"),
                );
            }
            rangeInput.style.setProperty(
                "--border-radius",
                roundedEdges ? "5px" : "0px",
            );
        }
    }
</script>

{#if useWaveForm}
    {#if showTrackTime}
        <div class="timeFlex">
            <p>{formatTime(currentTime)}</p>
            <p>{formatTime(duration)}</p>
        </div>
    {/if}


    <SeekableWavForm
        playedColor={waveformPlayedColor}
        baseColor={waveformBaseColor}
        audioUrl={$audioPlayerUrl}
        height={waveHeight}
        zoom={1}
        mirrorScale={0.55}
        gapPx={3}
        gapOpacity={0.1}
    />


{:else if $userTapped}
    <div class="wrapEntireRange" class:smallRange={!showTrackTime}>
        {#if $audioPlayerState !== "Loading"}
            {#if duration >= 0}
                <div
                    in:fade={{ duration: 150 }}
                    out:fade={{ duration: 150 }}
                    class="contentWrapper"
                >
                    <div class="rangeWrapper">
                        <input
                            bind:this={rangeInput}
                            class="audioRangeInput"
                            type="range"
                            min="0"
                            max={duration}
                            step="1"
                            bind:value={currentTime}
                            on:input={seek}
                        />
                    </div>
                    {#if showTrackTime}
                        <div class="timeFlex">
                            <p>{formatTime(currentTime)}</p>
                            <p>{formatTime(duration)}</p>
                        </div>
                    {/if}
                </div>
            {/if}
        {:else}
            <div
                in:fade={{ duration: 150 }}
                out:fade={{ duration: 150 }}
                class="contentWrapper"
            >
                <div class="wrapLoaderJ">
                    <AudioLoader
                        height={"7px"}
                        backgroundColor={"transparent"}
                    />
                </div>
            </div>
        {/if}
    </div>
{:else}
    <div class="wrapEntireRange" class:smallRange={!showTrackTime}>
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

<!-- <p style="font-size: 8pt;">UserTapped {$userTapped} | {$audioPlayerState}</p> -->

<style>
    .wrapEntireRange {
        height: 38px;
        position: relative; /* Allows children to be positioned absolutely */
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
    .rangeWrapper {
        padding: 0;
        margin: 0;
        height: 7px;
        position: relative;
    }
    .audioRangeInput {
        width: 100%;
        height: 7px;
        appearance: none;
        background: transparent;
        position: absolute;
        top: 0;
        left: 0;
        padding: 0;
        margin: 0;
        cursor: pointer;
    }
    /* Chrome, Safari, Edge */
    .audioRangeInput::-webkit-slider-runnable-track {
        height: 7px;
        background: linear-gradient(
            to right,
            var(--accent, #d1d1d1) var(--progress, 0%),
            var(--accent-faded, rgba(196, 196, 196, 0.267)) var(--progress, 0%)
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
    /* Firefox */
    .audioRangeInput::-moz-range-track {
        height: 7px;
        background: var(--accent-faded, rgba(0, 123, 255, 0.1));
        border-radius: var(--border-radius, 5px);
    }
    .audioRangeInput::-moz-range-progress {
        background: var(--accent, #d1d1d1);
        height: 7px;
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
