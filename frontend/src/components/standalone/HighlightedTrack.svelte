<script lang="ts">
    import { fade } from "svelte/transition";
    import {
        selectedBeat,
        setAudioUrl,
    } from "../../stores/AudioPlayer/selectedBeatStore";
    import "./HighlightedTrack.css";
    import {
    audioPlayerErrorMessage,
        audioPlayerState,
        pauseTrack,
        playTrack,
        resetTrackTimer,
        userTapped,
    } from "../../stores/AudioPlayerStore";
    import SoundPlaying from "../Icons/svg/SoundPlaying.svelte";
    import AudioRange from "../misc/AudioRange.svelte";
    import BoxButton from "../buttons/BoxButton.svelte";
    import SpinLoader from "../loaders/Loader.svelte";
    import AudioControlBox from "./AudioPlayerControls.svelte";
    import AlbumArtwork from "../UI/AlbumArtwork.svelte";
    import AudioPlayerState from "./AudioPlayerState.svelte";

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
                <button class="artPlayPause" on:click={handleArtworkClick}>
                    {#key $selectedBeat}
                        <AlbumArtwork
                            width={"100%"}
                            imageUrl={$selectedBeat.artworkUrl}
                        />
                    {/key}
                </button>
            </div>

            <div class="ht_trackInfo">

                <AudioPlayerState />

                <h2 class="ht_title">{$selectedBeat.beatTitle}</h2>

                <p class="keyandMode">
                    {$selectedBeat.key}
                    {$selectedBeat.mode} - {$selectedBeat.bpm} BPM
                </p>

                <AudioControlBox {playOrPauseIcon}></AudioControlBox>

                <AudioRange
                    waveHeight={60}
                    useWaveForm={true}
                />
            </div>
        </div>
    </div>
{/if}
