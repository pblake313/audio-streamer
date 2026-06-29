<script lang="ts">
    import { audioPlayerState, pauseTrack, playTrack, resetTrackTimer, smartNextTrack, smartPreviousTrack, userTapped } from "../../stores/AudioPlayerStore";
    import PlayPauseButton from "../buttons/music/PlayPauseButton.svelte";
    import SeekButton from "../buttons/music/SeekButton.svelte";
    import './AudioPlayerControls.css'


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

    export let playOrPauseIcon

</script>

<div class="apc_container">
    <SeekButton
        iconHeight={"12px"}
        isDisabled={["Buffering", "Loading"].includes($audioPlayerState) &&
            $userTapped}
        on:seek={() => {
            resetTrackTimer();
            smartPreviousTrack();
        }}
        rewindOrForward={"rewind"}
    />

    <div class="wPlayPlauser">
        <PlayPauseButton
            playOrPause={playOrPauseIcon}
            isDisabled={["Buffering", "Loading"].includes($audioPlayerState) &&
                $userTapped}
            on:togglePlayPause={handlePlayPauseClick}
            color={"#f7f7f7"}
            playIconHeight={"22px"}
            pauseIconHeight={"20px"}
            height={"50px"}
        />
    </div>

    <SeekButton
        iconHeight={"12px"}
        isDisabled={["Buffering", "Loading"].includes($audioPlayerState) &&
            $userTapped}
        on:seek={() => {
            resetTrackTimer();
            smartNextTrack();
        }}
    />
</div>
