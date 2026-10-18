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
    import { formatTrackMeta } from "../../helpers/formatters";
    import SeekButton from "../buttons/music/SeekButton.svelte";
    import PlayPauseButton from "../buttons/music/PlayPauseButton.svelte";
    import ShuffleButton from "../buttons/music/ShuffleButton.svelte";
    import RepeatButton from "../buttons/music/RepeatButton.svelte";
    import { scrolledTwoFifty } from "../../stores/AudioStyleStore";
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    import BoxButton from "../buttons/BoxButton.svelte";
    import CloseButton from "../buttons/CloseButton.svelte";
    import { goto } from "$app/navigation";
    import Modal from "../misc/Modal.svelte";
    import AlbumArtwork from "../UI/AlbumArtwork.svelte";
    import { fade } from "svelte/transition";
    import { swapIn, swapOut } from "../../helpers/transitions";
    import { showAudioPlayer } from "../../stores/AudioPlayer/BeatsStore";

    let lastUrl: string | null = null;

    $: if ($audioPlayerUrl && $audioPlayerUrl !== lastUrl) {
        const audio = get(audioStore);

        if (audio) {
            audio.src = $audioPlayerUrl;
            lastUrl = $audioPlayerUrl;

            if ($useAutoPlay) {
                autoPlayTrack();
                useAutoPlay.set(false);
            }
        }
    }

    function checkScrollPosition() {
        scrolledTwoFifty.set(window.scrollY >= 250);
    }

    let playOrPauseIcon: "play" | "pause" = "play";

    $: if ($audioPlayerState !== "Loading" && $audioPlayerState !== "Buffering") {
        playOrPauseIcon = $audioPlayerState === "Playing" ? "pause" : "play";
    }

    onMount(() => {
        window.addEventListener("scroll", checkScrollPosition);
        checkScrollPosition();

        return () => {
            window.removeEventListener("scroll", checkScrollPosition);
        };
    });

    $: isOnBeatsRoute = $page.url.pathname === "/portal";

    $: hideStreamPlayer =
        (!$scrolledTwoFifty && isOnBeatsRoute) ||
        $audioPlayerState === "Idle";

    // true = audio player is showing
    $: showAudioPlayer.set(
        Boolean($selectedBeat) && !hideStreamPlayer && !$inTimeout
    );
</script>

{#if $selectedBeat}
    <div
        class="as_wrapper"
        class:hideStreamPlayer={hideStreamPlayer || $inTimeout}
    >
        <AudioRange
            roundedEdges={false}
            showTrackTime={false}
            audio={$audioStore ?? undefined}

        />

        <div class="innerAudio">
            <button
                class="as_albumArtwork"
                on:click={() => {
                    goto("/portal");
                }}
            >
                <div class="as_swapStack">
                    {#key $selectedBeat.id}
                        <div in:fade={{ duration: 500, delay: 80 }} out:fade={{ duration: 350 }}>
                            <AlbumArtwork width={"100%"} imageUrl={$selectedBeat.artworkUrl} />
                        </div>
                    {/key}
                </div>
            </button>

            <div class="streamInfoFlex">
                <div class="trackInfoStream as_swapStack">
                    {#key $selectedBeat.id}
                        <div class="as_trackText" in:swapIn={{ y: 8 }} out:swapOut={{ y: -4 }}>
                            <p class="as_title">{$selectedBeat.beatTitle}</p>
                            <p class="as_subtitle">
                                {formatTrackMeta($selectedBeat)}
                            </p>
                        </div>
                    {/key}
                </div>

                <div class="streamTrackControls">
                    <div class="as_modeButton">
                        <ShuffleButton size={"28px"} iconHeight={"19px"} />
                    </div>

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

                    <div class="as_modeButton">
                        <RepeatButton size={"28px"} iconHeight={"19px"} />
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
                    fullWidth={true}
                    buttonText={"Yes"}
                    on:click={() => {
                        resetTrackTimer();
                        playTrack();
                    }}
                />
            </div>
        </div>
    </Modal>
{/if}