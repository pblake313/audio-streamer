<script lang="ts">
    import { selectedBeat } from "../../stores/AudioPlayer/selectedBeatStore";
    import {
        audioPlayerState,
        audioPlayerUrl,
        audioStore,
        autoPlayTrack,
        inTimeout,
        pauseTrack,
        playTrack,
        resetTrackTimer,
        smartNextTrack,
        smartPreviousTrack,
        stopTrack,
        useAutoPlay
    } from "../../stores/AudioPlayerStore";
    import { get } from "svelte/store";
    import AudioRange from "../misc/AudioRange.svelte";
    import "./AudioStreamer.css";
    import SeekButton from "../buttons/music/SeekButton.svelte";
    import PlayPauseButton from "../buttons/music/PlayPauseButton.svelte";
    import { scrolledTwoFifty } from "../../stores/AudioStyleStore";
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    import BoxButton from "../buttons/BoxButton.svelte";
    import CloseButton from "../buttons/CloseButton.svelte";
    import { goto } from "$app/navigation";
    import Modal from "../misc/Modal.svelte";

    // 👇 Track last URL we've applied to the audio element
    let lastUrl: string | null = null;

    // Ensure audio.src is updated when beat changes
    $: if ($audioPlayerUrl && $audioPlayerUrl !== lastUrl) {
        const audio = get(audioStore);
        if (audio) {
            // Only run when URL actually changes
            audio.src = $audioPlayerUrl;
            lastUrl = $audioPlayerUrl;

            // Only autoplay on a fresh URL change AND when requested
            if ($useAutoPlay) {
                autoPlayTrack();
                useAutoPlay.set(false);
            }
        }
    }

    // Function that checks if the page has scrolled 500 pixels or more
    function checkScrollPosition() {
        if (window.scrollY >= 250) {
            scrolledTwoFifty.set(true);
        } else {
            scrolledTwoFifty.set(false);
        }
    }

        // controls the icon ONLY
    let playOrPauseIcon: "play" | "pause" = "play";

    // when NOT loading, sync icon to player state
    $: if ($audioPlayerState !== "Loading" && $audioPlayerState !== "Buffering") {
        playOrPauseIcon = $audioPlayerState === "Playing" ? "pause" : "play";
    }

    // Attach the scroll event listener on mount
    onMount(() => {
        window.addEventListener("scroll", checkScrollPosition);
        // Run it once immediately to set the initial state
        checkScrollPosition();
        return () => {
            window.removeEventListener("scroll", checkScrollPosition);
        };
    });

    $: isOnBeatsRoute = $page.url.pathname === "/portal";

    $: hideStreamPlayer = (!$scrolledTwoFifty && isOnBeatsRoute) || $audioPlayerState === "Idle";
</script>

{#if $selectedBeat}
    <div
        class="audioStreamWrapper"
        class:hideStreamPlayer={hideStreamPlayer || $inTimeout}
    >
        <AudioRange
            roundedEdges={false}
            showTrackTime={false}
            imageUrl={$selectedBeat.artworkUrl || null}
        />

        <div class="innerAudio">
            <!-- fade help -->
            <button class="bottomArt" on:click={() => { goto("/portal"); }}>
                <img
                    class="miniArt"
                    src="{$selectedBeat.artworkUrl}"
                    alt="{$selectedBeat.beatTitle}"
                />
            </button>

            <div class="streamInfoFlex">
                <!-- fade help -->
                <div class="trackInfoStream">
                    <p>{$selectedBeat.beatTitle}</p>
                    <p style="opacity: .5; font-size: 9pt">
                        {$selectedBeat.bpm} BPM - {$selectedBeat.key} {$selectedBeat.mode}
                    </p>
                </div>

                <!-- fade help -->
                <div class="streamTrackControls">
                    <div class="wrapSeeka">
                        <SeekButton
                            iconHeight={"12px"}
                            on:seek={() => {
                                resetTrackTimer();
                                smartPreviousTrack();
                            }}
                            rewindOrForward={"rewind"}
                        />
                    </div>
                    <PlayPauseButton
                        playOrPause={playOrPauseIcon}
                        isDisabled={
                            $audioPlayerState === "Loading" ||
                            $audioPlayerState === "Buffering"
                        }
                        on:togglePlayPause={() => {
                            resetTrackTimer();
                            $audioPlayerState === "Playing"
                                ? pauseTrack()
                                : playTrack();
                        }}
                        color={"#f7f7f7"}
                        playIconHeight={"22px"}
                        pauseIconHeight={"20px"}
                        height={"50px"}
                    />
                    <div class="wrapSeeka">
                        <SeekButton
                            iconHeight={"12px"}
                            on:seek={() => {
                                resetTrackTimer();
                                smartNextTrack();
                            }}
                        />
                    </div>

                    <div class="closeSplit"></div>

                    <CloseButton
                        on:click={stopTrack}
                        iconThickness={"thick"}
                        color={"f7f7f7"}
                    />
                </div>
            </div>
        </div>
    </div>
{/if}

{#if $inTimeout}
    <Modal modalTitle={"Still Listening?"} on:closeModal={resetTrackTimer}>
        <div style="text-align: left;">
            <br />
            <p>Are you still there?</p>
            <br />
            <div style="display: flex; justify-content: space-between;">
                <div></div>
                <BoxButton
                    buttonStyle={"stayWhite"}
                    fullWidth={true}
                    buttonText={"Yes"}
                    on:click={(e) => {
                        resetTrackTimer();
                        playTrack();
                    }}
                />
            </div>
        </div>
    </Modal>
{/if}
