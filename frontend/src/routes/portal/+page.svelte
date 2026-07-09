<script lang="ts">
    import { onMount } from "svelte";
    import HighlightedTrack from "../../components/standalone/HighlightedTrack.svelte";
    import {
        beatFetchError,
        beats,
        fetchBeats,
        isFetchingBeats,
        oneBeatFetchSuccessfull,
        showAudioPlayer,
    } from "../../stores/AudioPlayer/BeatsStore";
    import { selectedBeat } from "../../stores/AudioPlayer/selectedBeatStore";
    import {
        audioMode,
        pauseTrack,
        playTrack,
        smartNextTrack,
        smartPreviousTrack,
    } from "../../stores/AudioPlayerStore";
    import TrackList from "../../components/lists/TrackList/TrackList.svelte";
    import Loader from "../../components/loaders/Loader.svelte";
    import PageHeading from "../../components/page-components/PageHeading.svelte";
    import ABTester from "../../components/standalone/ABTester.svelte";

    // This reactive block runs every time $selectedBeat changes.
    $: if (
        typeof navigator !== "undefined" &&
        navigator.mediaSession &&
        $selectedBeat
    ) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: $selectedBeat.beatTitle,
            artist: "PATTSWAY",
            album:
                `${$selectedBeat.bpm} BPM - ${$selectedBeat.key} ${$selectedBeat.mode}` ||
                "Unknown Album",
            artwork: [
                {
                    src: $selectedBeat.artworkUrl,
                    sizes: "512x512", // optional, specify if known
                    type: "image/png", // optional, specify the MIME type
                },
            ],
        });

        // Set action handlers for lock screen and media keys.
        navigator.mediaSession.setActionHandler("play", () => {
            playTrack();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
            pauseTrack();
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => {
            smartPreviousTrack();
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
            smartNextTrack();
        });
    }

    onMount(async () => {
        if (!$oneBeatFetchSuccessfull) {
            await fetchBeats();
        }
    });
</script>

<svelte:head>
    <title>{$selectedBeat?.beatTitle || "Listen"}</title>
</svelte:head>

{#if $isFetchingBeats && !$oneBeatFetchSuccessfull}
    <Loader loaderStyle={"loader_full"} />
{:else if $beatFetchError}
    <PageHeading
        title={"Fetch Beats Error"}
        subtitle={$beatFetchError}
        buttonText={"Retry"}
        onButtonClick={() => {
            fetchBeats();
        }}
    />
{:else}
    {#if $audioMode === "streamer"}
        <HighlightedTrack />
    {:else}
        <ABTester />
    {/if}
    <div class="wrapTrackList">
        <TrackList />
    </div>
{/if}

<style>
    .wrapTrackList {
        margin: auto;
        padding: 25px;
        max-width: 1250px;
    }

    @media (max-width: 575px) {
        .wrapTrackList {
            margin: auto;
            max-width: 1250px;
            padding: 0px 15px;
        }
    }
</style>
