<script lang="ts">
    import { fade } from "svelte/transition";
    import type { Beat } from "../../lib/types/Beats";
    import { abAudioPlayerState } from "../../stores/ABTestStore";
    import SoundPlaying from "../Icons/svg/SoundPlaying.svelte";
    import AudioRange from "../misc/AudioRange.svelte";
    import AlbumArtwork from "../UI/AlbumArtwork.svelte";
    import "./ABTrack.css";

    export let track: Beat | null;
    export let notActive: boolean = false;
    export let selected: boolean = false;
    export let emptyTitle: string = "Select Track";

    export let audioElement: HTMLAudioElement | undefined = undefined;

    export let trackClicked: ((track: Beat) => void) | undefined;

    function handleTrackClick(event: MouseEvent) {
        event.stopPropagation();

        if (!track) return;

        const target = event.target as HTMLElement;

        // Do not select the track when interacting with the audio range.
        if (target.closest(".abTrack_bottom")) {
            return;
        }

        trackClicked?.(track);
    }

    function handleTrackKeydown(event: KeyboardEvent) {
        // Ignore keyboard events coming from children such as the range input.
        if (event.target !== event.currentTarget) {
            return;
        }

        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (!track) return;

        trackClicked?.(track);
    }

    function handlePointerDown(event: PointerEvent) {
        event.stopPropagation();
    }
</script>

{#if track}
    <audio
        bind:this={audioElement}
        src={track.mp3Url}
        preload="metadata"
        style="display: none;"
        loop
    ></audio>

    <div
        role="button"
        tabindex="0"
        aria-pressed={selected}
        on:click={handleTrackClick}
        on:keydown={handleTrackKeydown}
        on:pointerdown={handlePointerDown}
        class="abTrack_container"
        class:abTrack_notActive={notActive}
        class:abTrack_selected={selected}
    >
        <div class="abTrack_artwork">
            <AlbumArtwork width="100%" imageUrl={track.artworkUrl} />
        </div>

        <div class="abTrack_details">
            <div class="abTrack_top">
                <div class="abTrack_titleFlex">
                    <h5>{track.beatTitle}</h5>

                    {#if $abAudioPlayerState === "playing" && !notActive}
                        <div
                            in:fade={{ duration: 350 }}
                            out:fade={{ duration: 350 }}
                        >
                            <SoundPlaying />
                        </div>
                    {/if}
                </div>

                <p>
                    {track.key}
                    {track.mode} | {track.bpm} BPM
                </p>
            </div>

            <div
                class="abTrack_bottom"
                class:abTrack_rangeNotActive={notActive}
            >
                <AudioRange
                    useWaveForm={true}
                    waveHeight={35}
                    audio={audioElement}
                />
            </div>
        </div>
    </div>
{:else}
    <div class="abTrack_container">
        <div class="abTrack_artwork">
            <AlbumArtwork width="100%" />
        </div>
        <div class="abTrack_details">

            <h5>{emptyTitle}</h5>

            <p>Select a track to begin A|B testing.</p>
        </div>

    </div>
{/if}
