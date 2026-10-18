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
        toggleAB,
    } from "../../stores/ABTestStore";
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
                label={"A"}
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
            <!-- clicking anywhere on the switch flips A <-> B -->
            <button
                type="button"
                class="ab_switch"
                class:ab_switch_b={$selectedAB === "B"}
                aria-label="Listening to track {$selectedAB}. Switch to track {$selectedAB === "A" ? "B" : "A"}"
                on:click={toggleAB}
            >
                <span class="ab_switchThumb" aria-hidden="true"></span>
                {#each ["A", "B"] as side}
                    <span
                        class="ab_switchOption"
                        class:ab_switchOption_active={$selectedAB === side}
                        aria-hidden="true"
                    >
                        {side}
                    </span>
                {/each}
            </button>

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
                label={"B"}
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
