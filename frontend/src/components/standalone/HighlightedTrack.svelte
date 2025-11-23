<script lang="ts">
    import { fade } from "svelte/transition";
    import { selectedBeat, setAudioUrl } from "../../stores/AudioPlayer/selectedBeatStore";
    import "./HighlightedTrack.css";
    import {
        audioPlayerState,
        pauseTrack,
        playTrack,
        resetTrackTimer,
        smartNextTrack,
        smartPreviousTrack,
        userTapped
    } from "../../stores/AudioPlayerStore";
    import SoundPlaying from "../svg/Icons/SoundPlaying.svelte";
    import SeekButton from "../buttons/music/SeekButton.svelte";
    import PlayPauseButton from "../buttons/music/PlayPauseButton.svelte";
    import AudioRange from "./AudioRange.svelte";
    import SpinLoader from "../reusable/Loaders/SpinLoader.svelte";
    import BoxButton from "../buttons/BoxButton.svelte";

    // controls the icon ONLY
    let playOrPauseIcon: "play" | "pause" = "play";

    // when NOT loading, sync icon to player state
    $: if ($audioPlayerState !== "Loading" && $audioPlayerState !== "Buffering") {
        playOrPauseIcon = $audioPlayerState === "Playing" ? "pause" : "play";
    }

    let isRetrying: boolean = false;

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

    async function handleRetryClick() {
        try {
            isRetrying = true;

            // This is definitely a user gesture too
            if (!$userTapped) {
                userTapped.set(true);
            }

            if (!$selectedBeat) return;
            await setAudioUrl($selectedBeat);
            playTrack();
        } finally {
            isRetrying = false;
        }
    }

    function handleArtworkClick() {
        // Same behavior as the main play/pause button
        handlePlayPauseClick();
    }
</script>

{#if $selectedBeat}
    <div class="wrapHighlightedTrack">
        <div class="topperGradient"></div>
        <div class="bommo"></div>

        {#key $selectedBeat}
            <img
                in:fade={{ duration: 600 }}
                out:fade={{ duration: 600 }}
                class="highlightedTrackBackground"
                src="{$selectedBeat.artworkUrl}"
                alt="{$selectedBeat.beatTitle}"
            />
        {/key}

        <div class="insideHighlight">
            <div class="holdBeatArt">
                <!-- ARTWORK CLICK = user gesture play/pause -->
                <button class="artPlayPause" on:click={handleArtworkClick}>
                    {#key $selectedBeat}
                        <img
                            in:fade={{ duration: 600 }}
                            out:fade={{ duration: 600 }}
                            class="trackArtworkImage"
                            src="{$selectedBeat.artworkUrl}"
                            alt="{$selectedBeat.beatTitle}"
                        />
                    {/key}
                </button>

                <div class="smallerTrackInfo">
                    {#if $audioPlayerState === "Error"}
                        <div class="retryOnError">
                            <p class="audioError">Load Audio Error</p>
                            <BoxButton
                                buttonText={"Retry Load Stream"}
                                buttonStyle={"stayWhite"}
                                tightPad={true}
                                buttonIcon={isRetrying ? "loading" : null}
                                on:click={handleRetryClick}
                                fontSize={"9pt"}
                            />
                        </div>
                    {/if}

                    <div class="trackInfoTop">
                        <!-- track state -->
                        {#if $userTapped}
                            <div class="trackStateFlex">
                                {#if $audioPlayerState === "Playing" || $audioPlayerState === "Loading"}
                                    <div class="trackIcon">
                                        {#if $audioPlayerState === "Playing"}
                                            <div out:fade={{ duration: 300 }} in:fade={{ duration: 300 }}>
                                                <SoundPlaying color={"#f7f7f7"} />
                                            </div>
                                        {:else if $audioPlayerState === "Loading"}
                                            <SpinLoader height={"10px"} />
                                        {/if}
                                    </div>
                                {/if}

                                <div class="trackStateText">
                                    {#if $audioPlayerState === "Idle"}
                                        <p>Waiting</p>
                                    {:else}
                                        <p>{$audioPlayerState}</p>
                                    {/if}
                                </div>
                            </div>
                        {/if}

                        <div class="wrapHighlightedTitle">
                            <h2>{$selectedBeat.beatTitle}</h2>

                            {#if $audioPlayerState === "Playing" || $audioPlayerState === "Loading"}
                                <div class="mobTrackIcon">
                                    {#if $audioPlayerState === "Playing"}
                                        <div out:fade={{ duration: 300 }} in:fade={{ duration: 300 }}>
                                            <SoundPlaying color={"#f7f7f7"} />
                                        </div>
                                    {:else if $audioPlayerState === "Loading" && $userTapped}
                                        <div out:fade={{ duration: 300 }} in:fade={{ duration: 300 }}>
                                            <SpinLoader height={"15px"} />
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>

                        <p class="keyandMode">
                            {$selectedBeat.key} {$selectedBeat.mode} - {$selectedBeat.bpm} BPM
                        </p>
                    </div>

                    <div class="trackControls">
                        <!-- empty div for styling purposes -->
                        <div></div>

                        <div>
                            <AudioRange imageUrl={$selectedBeat?.artworkUrl || null} />

                            <div class="highlightedTrackControls">
                                <SeekButton
                                    iconHeight={"12px"}
                                    isDisabled={["Buffering", "Loading"].includes($audioPlayerState) && $userTapped}
                                    on:seek={() => {
                                        resetTrackTimer();
                                        smartPreviousTrack();
                                    }}
                                    rewindOrForward={"rewind"}
                                />

                                <div class="wPlayPlauser">
                                    <PlayPauseButton
                                        playOrPause={playOrPauseIcon}
                                        isDisabled={["Buffering", "Loading"].includes($audioPlayerState) && $userTapped}
                                        on:togglePlayPause={handlePlayPauseClick}
                                        color={"#f7f7f7"}
                                        playIconHeight={"22px"}
                                        pauseIconHeight={"20px"}
                                        height={"50px"}
                                    />
                                </div>

                                <SeekButton
                                    iconHeight={"12px"}
                                    isDisabled={["Buffering", "Loading"].includes($audioPlayerState) && $userTapped}
                                    on:seek={() => {
                                        resetTrackTimer();
                                        smartNextTrack();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="highlightedTrackInfo">
                <div class="trackInfoTop">
                    <!-- track state -->
                    {#if $userTapped}
                        <div class="trackStateFlex">
                            {#if $audioPlayerState === "Playing" || $audioPlayerState === "Loading"}
                                <div class="trackIcon">
                                    {#if $audioPlayerState === "Playing"}
                                        <SoundPlaying color={"#f7f7f7"} />
                                    {:else if $audioPlayerState === "Loading" && $userTapped}
                                        <SpinLoader height={"15px"} />
                                    {/if}
                                </div>
                            {/if}

                            <div class="trackStateText">
                                {#if $audioPlayerState === "Idle"}
                                    <p>Waiting</p>
                                {:else if $audioPlayerState === "Error"}
                                    <div class="retryOnError">
                                        <p class="audioError">Load Audio Error</p>
                                        <BoxButton
                                            buttonText={"Retry Load Stream"}
                                            buttonStyle={"stayWhite"}
                                            tightPad={true}
                                            buttonIcon={isRetrying ? "loading" : null}
                                            on:click={handleRetryClick}
                                            fontSize={"9pt"}
                                        />
                                    </div>
                                {:else}
                                    <p>{$audioPlayerState}</p>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <div class="wrapHighlightedTitle">
                        <h2>{$selectedBeat.beatTitle}</h2>
                    </div>

                    <p class="keyandMode">
                        {$selectedBeat.key} {$selectedBeat.mode} - {$selectedBeat.bpm} BPM
                    </p>
                </div>

                <div class="trackInfoBottom">
                    <div class="trackControls">
                        <!-- empty div for styling purposes -->
                        <div></div>

                        <div>
                            <AudioRange imageUrl={$selectedBeat?.artworkUrl || null} />

                            <div class="highlightedTrackControls">
                                <SeekButton
                                    iconHeight={"12px"}
                                    isDisabled={["Buffering", "Loading"].includes($audioPlayerState) && $userTapped}
                                    on:seek={() => {
                                        resetTrackTimer();
                                        smartPreviousTrack();
                                    }}
                                    rewindOrForward={"rewind"}
                                />

                                <div class="wPlayPlauser">
                                    <PlayPauseButton
                                        playOrPause={playOrPauseIcon}
                                        isDisabled={["Buffering", "Loading"].includes($audioPlayerState) && $userTapped}
                                        on:togglePlayPause={handlePlayPauseClick}
                                        color={"#f7f7f7"}
                                        playIconHeight={"22px"}
                                        pauseIconHeight={"20px"}
                                        height={"50px"}
                                    />
                                </div>

                                <SeekButton
                                    iconHeight={"12px"}
                                    isDisabled={["Buffering", "Loading"].includes($audioPlayerState) && $userTapped}
                                    on:seek={() => {
                                        resetTrackTimer();
                                        smartNextTrack();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
