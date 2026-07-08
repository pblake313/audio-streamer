<script lang="ts">
    import {
        trackA,
        trackB,
        trackAAudioElement,
        trackBAudioElement,
        selectedAB,
        abAudioPlayerState,
        abHandlePlayPause,
        abError,
        selectAB,
    } from "../../stores/ABTestStore";
    import ABToggler from "../buttons/music/ABToggler.svelte";
    import PlayPauseButton from "../buttons/music/PlayPauseButton.svelte";
    import "./ABTester.css";
    import ABTrack from "./ABTrack.svelte";
</script>

<div class="ab_container">
    <div class="ab_background">
        <div class="ab_topFade"></div>
        <div class="ab_bottomFade"></div>
        {#if $trackA}
            <img
                class="ab_trackA_background"
                class:ab_trackASelected={$selectedAB === "A"}
                src={$trackA.artworkUrl}
                alt="Track A background"
            />
        {/if}

        {#if $trackB}
            <img
                class="ab_trackB_background"
                class:ab_trackASelected={$selectedAB === "B"}
                src={$trackB.artworkUrl}
                alt="Track B background"
            />
        {/if}
    </div>

    <div class="ab_inside">
        <div class="ab_track">
            <ABTrack
                track={$trackA}
                emptyTitle={"Track A"}
                selected={$selectedAB === "A"}
                bind:audioElement={$trackAAudioElement}
                notActive={$selectedAB === "B" &&
                    $abAudioPlayerState === "playing"}
                trackClicked={() => {
                    if (
                        $abAudioPlayerState === "playing" &&
                        $selectedAB === "A"
                    ) {
                        abHandlePlayPause();
                    } else if ($abAudioPlayerState === "paused") {
                        selectAB("A");

                        abHandlePlayPause();
                    } else {
                        selectAB("A");
                    }
                }}
            />
        </div>

        <div class="ab_toggler">
            <ABToggler />

            <PlayPauseButton
                on:togglePlayPause={abHandlePlayPause}
                playOrPause={$abAudioPlayerState === "playing"
                    ? "pause"
                    : "play"}
                color={"#f7f7f7"}
                height={"65px"}
            />
        </div>

        <div class="ab_track">
            <ABTrack
                track={$trackB}
                emptyTitle={"Track B"}
                selected={$selectedAB === "B"}
                bind:audioElement={$trackBAudioElement}
                notActive={$selectedAB === "A" &&
                    $abAudioPlayerState === "playing"}
                trackClicked={() => {
                    if (
                        $abAudioPlayerState === "playing" &&
                        $selectedAB === "B"
                    ) {
                        abHandlePlayPause();
                    } else if ($abAudioPlayerState === "paused") {
                        selectAB("B");

                        abHandlePlayPause();
                    } else {
                        selectAB("B");
                    }
                }}
            />
        </div>
    </div>

    <br />
    {#if $abError}
        <p class="ab_error">{$abError}</p>
    {/if}

</div>
