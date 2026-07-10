<script lang="ts">
    import type { Beat } from "../../../lib/types/Beats";
    import {
        audioPlayerState,
        pauseTrack,
        playTrack,
        resetTrackTimer,
        userTapped,
    } from "../../../stores/AudioPlayerStore";
    import PlayPauseButton from "../../buttons/music/PlayPauseButton.svelte";
    import PauseIcon from "../../Icons/svg/PauseIcon.svelte";
    import PlayIcon from "../../Icons/svg/PlayIcon.svelte";
    import AlbumArtwork from "../../UI/AlbumArtwork.svelte";
    import AudioPlayerState from "../AudioPlayerState.svelte";
    import "./MobileNavAudioControls.css";
    export let beat: Beat;

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
</script>

<button class="mnac_button" on:click={handlePlayPauseClick}>
    <div class="mnac_artwork">
        <AlbumArtwork width={"100%"} imageUrl={beat.artworkUrl} />
    </div>
    <div class="mnac_details">
        <div class="mnac_trackInfo">
            <div class="mnac_playTitle">
                <AudioPlayerState />
                <p>{beat.beatTitle}</p>
            </div>
            <p>{beat.key} {beat.mode} | {beat.bpm} BPM</p>
        </div>

        <div class="mnac_iconContainer">
            <div class="mnac_icon">
                {#if $audioPlayerState === 'Playing'}
                <PauseIcon height="30px" color={"#f7f7f7"}/>
                {:else}
                <PlayIcon height="30px" color={"#f7f7f7"}/>
                {/if}
            </div>
        </div>

    </div>
</button>
