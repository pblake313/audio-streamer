<script lang="ts">
    import { selectedBeat, setAudioUrl } from "../../stores/AudioPlayer/selectedBeatStore";
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

        {#if $audioPlayerState === "Playing" || $audioPlayerState === "Loading"}
            <div class="trackIcon">
                {#if $audioPlayerState === "Playing"}
                    <SoundPlaying color={"#f7f7f7"} />
                {:else if $audioPlayerState === "Loading" && $userTapped}
                    <Loader height={"15px"} />
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
                        tightPad={true}
                        buttonIcon={isRetrying ? "loading" : null}
                        on:click={handleRetryClick}
                    />
                </div>
            {:else}
                <p>{$audioPlayerState}</p>
            {/if}
        </div>
    </div>
{:else if !$userTapped}
    <div class="aps_flex">
        <p>Not Tapped: {$audioPlayerState}</p>
    </div>
{/if}

<!-- old jaunt. -->

<!-- <div class="trackStateFlex">


</div> -->
