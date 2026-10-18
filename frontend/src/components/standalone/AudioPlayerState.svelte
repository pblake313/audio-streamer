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
{:else if $userTapped && $audioPlayerState === "Error"}
    <div class="aps_flex">
        <div class="trackStateText">
            <div class="retryOnError">
                <p class="audioError">Load Audio Error</p>
                <BoxButton
                    buttonText={"Retry Load Stream"}
                    tightPad={true}
                    buttonIcon={isRetrying ? "loading" : null}
                    on:click={handleRetryClick}
                />
            </div>
        </div>
    </div>
{:else}
    <!-- icons only: spinner while loading/buffering, bars otherwise -->
    <div class="aps_flex">
        <div class="aps_containIcon">
            {#if $userTapped && ($audioPlayerState === "Loading" || $audioPlayerState === "Buffering")}
                <div class="aps_iconWrapper aps_loader">
                    <Loader height={"20px"} />
                </div>
            {:else}
                <div class="aps_iconWrapper">
                    <SoundPlaying
                        status={$audioPlayerState === "Playing" ? "playing" : "idle"}
                    />
                </div>
            {/if}
        </div>
    </div>
{/if}
