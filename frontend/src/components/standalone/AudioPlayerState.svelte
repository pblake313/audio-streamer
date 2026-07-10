<script lang="ts">
    import { fade } from "svelte/transition";
    import {
        selectedBeat,
        setAudioUrl,
    } from "../../stores/AudioPlayer/selectedBeatStore";
    import {
        audioPlayerErrorMessage,
        audioPlayerState,
        playTrack,
        userTapped,
    } from "../../stores/AudioPlayerStore";
    import BoxButton from "../buttons/BoxButton.svelte";
    import SoundPlaying from "../Icons/svg/SoundPlaying.svelte";
    import Loader from "../loaders/Loader.svelte";
    import "./AudioPlayerState.css";
    let isRetrying: boolean = false;

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
</script>

{#if $audioPlayerErrorMessage}
    <p style="color: red;">{$audioPlayerErrorMessage}</p>
{:else if $userTapped}
    <div class="aps_flex">
        {#if $audioPlayerState === "Playing" || $audioPlayerState === "Loading" || $audioPlayerState === "Paused"}
            <div class="aps_containIcon" >
                {#if $audioPlayerState === "Playing" || $audioPlayerState === "Paused"}

                    <!-- aslo, when its idle display the same thbing as when its paused. -->
                    <div class="aps_iconWrapper">
                        <SoundPlaying
                            status={$audioPlayerState === "Paused"
                                ? "idle"
                                : "playing"}
                        />
                    </div>
                {:else if $audioPlayerState === "Loading" && $userTapped}
                    <div class="aps_iconWrapper aps_loader">
                        <Loader height={"20px"} />
                    </div>
                {/if}
            </div>
        {/if}

        <div class="trackStateText">
            {#if $audioPlayerState === "Error"}
                <div class="retryOnError">
                    <p class="audioError">Load Audio Error</p>
                    <BoxButton
                        buttonText={"Retry Load Stream"}
                        tightPad={true}
                        buttonIcon={isRetrying ? "loading" : null}
                        on:click={handleRetryClick}
                    />
                </div>
            {:else if $audioPlayerState !== "Playing" && $audioPlayerState !== "Paused" && $audioPlayerState !== "Loading"}
                <p class="aps_text">{$audioPlayerState}</p>
            {/if}
        </div>
    </div>
{:else if !$userTapped}
    <div class="aps_flex" >
        <div class="aps_containIcon">
            <div class="aps_iconWrapper" >
                <SoundPlaying
                    status={$audioPlayerState === "Playing"
                        ? "playing"
                        : "idle"}
                />
            </div>
        </div>

        <p class="aps_text">{$audioPlayerState}</p>
    </div>
{/if}