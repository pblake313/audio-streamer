<script lang="ts">
    import { fade } from "svelte/transition";
    import "./HighlightedTrack.css";
    import { selectedBeat } from "../../stores/AudioPlayer/selectedBeatStore";
    import {
        audioPlayerState,
        audioStore,
        pauseTrack,
        playTrack,
        resetTrackTimer,
        userTapped,
    } from "../../stores/AudioPlayerStore";
    import AudioRange from "../misc/AudioRange.svelte";
    import AudioControlBox from "./AudioPlayerControls.svelte";
    import AlbumArtwork from "../UI/AlbumArtwork.svelte";
    import AudioPlayerState from "./AudioPlayerState.svelte";
    import PlayPauseButton from "../buttons/music/PlayPauseButton.svelte";

    // controls the icon ONLY
    let playOrPauseIcon: "play" | "pause" = "play";

    // when NOT loading, sync icon to player state
    $: if (
        $audioPlayerState !== "Loading" &&
        $audioPlayerState !== "Buffering"
    ) {
        playOrPauseIcon = $audioPlayerState === "Playing" ? "pause" : "play";
    }

    function handlePlayPauseClick() {
        resetTrackTimer();

        if ($audioPlayerState === "Playing") {
            // Normal pause
            pauseTrack();
        } else {
            // First intentional tap: mark as user gesture
            if (!$userTapped) {
                userTapped.set(true);
            }

            // Now actually try to play
            playTrack();
        }
    }

    function handleArtworkClick() {
        // Same behavior as the main play/pause button
        handlePlayPauseClick();
    }
</script>

{#if $selectedBeat}
    <div class="ht_wrapper">
        <div class="ht_topFade"></div>
        <div class="ht_bottomFade"></div>

        {#key $selectedBeat}
            <img
                in:fade={{ duration: 600 }}
                out:fade={{ duration: 600 }}
                class="ht_background"
                src={$selectedBeat.artworkUrl}
                alt={$selectedBeat.beatTitle}
            />
        {/key}

        <div class="ht_insideContainer">
            <div class="ht_artworkContainer">
                <!-- ARTWORK CLICK = user gesture play/pause -->

                <button class="ht_artworkButton" on:click={handleArtworkClick}>
                    {#key $selectedBeat}
                        <AlbumArtwork
                            width={"100%"}
                            imageUrl={$selectedBeat.artworkUrl}
                        />
                    {/key}

                    <!-- do not show on touch devices. -->
                    <div class="ht_albumOverlay">
                        <div class="ht_largePP">
                            <PlayPauseButton
                                height={"85px"}
                                playIconHeight={"50px"}
                                pauseIconHeight={"55px"}
                                playOrPause={playOrPauseIcon}
                                color={"#f7f7f7"}
                            />
                        </div>
                    </div>
                </button>
            </div>

            <div class="ht_trackInfo">
                <div class="ht_details">
                    <div class="ht_stateAndKey">
                        <AudioPlayerState />

                        <p class="ht_keyAndMode">
                            {$selectedBeat.key}
                            {$selectedBeat.mode} - {$selectedBeat.bpm} BPM
                        </p>
                    </div>
                    <h2 class="ht_title">{$selectedBeat.beatTitle}</h2>
                </div>

                <!-- <BeatTagsSwiper beat={$selectedBeat}/> -->

                <div class="ht_rangeControls">

                    <div class="ht_mobileRange">
                        <AudioRange
                            audio={$audioStore ?? undefined}
                            useWaveForm={false}
                            
                        />
                    </div>

                    <AudioControlBox {playOrPauseIcon}></AudioControlBox>

                    <div class="ht_deskRange">
                        <AudioRange
                            waveHeight={50}
                            useWaveForm={true}
                            audio={$audioStore ?? undefined}
                        />
                    </div>

           
                </div>
            </div>
        </div>
    </div>
{/if}
