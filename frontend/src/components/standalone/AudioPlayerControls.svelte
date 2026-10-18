<script lang="ts">
    import { audioPlayerState, pauseTrack, playTrack, resetTrackTimer, smartNextTrack, smartPreviousTrack, userTapped } from "../../stores/AudioPlayerStore";
    import PlayPauseButton from "../buttons/music/PlayPauseButton.svelte";
    import SeekButton from "../buttons/music/SeekButton.svelte";
    import ShuffleButton from "../buttons/music/ShuffleButton.svelte";
    import RepeatButton from "../buttons/music/RepeatButton.svelte";
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
    <div class="apc_mode">
        <ShuffleButton size={"32px"} />
    </div>

    <SeekButton
        iconHeight={"18px"}
        isDisabled={["Buffering", "Loading"].includes($audioPlayerState) &&
            $userTapped}
        on:seek={() => {
            resetTrackTimer();
            smartPreviousTrack();
        }}
        rewindOrForward={"rewind"}
        height={'55px'}
    />

    <div class="wPlayPlauser">
        <PlayPauseButton
            playOrPause={playOrPauseIcon}
            isDisabled={["Buffering", "Loading"].includes($audioPlayerState) &&
                $userTapped}
            on:togglePlayPause={handlePlayPauseClick}
            color={"#f7f7f7"}

            playIconHeight={"30px"}
            pauseIconHeight={"30px"}
            height={"65px"}
        />
    </div>

    <SeekButton
        iconHeight={"18px"}
        isDisabled={["Buffering", "Loading"].includes($audioPlayerState) &&
            $userTapped}
        on:seek={() => {
            resetTrackTimer();
            smartNextTrack();
        }}
        height={'55px'}

    />

    <div class="apc_mode">
        <RepeatButton size={"32px"} />
    </div>
</div>
