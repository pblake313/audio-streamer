<script lang="ts">
    import { formatTrackMeta } from "../../helpers/formatters";
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
    import ErrorNotice from "../../components/errors/ErrorNotice.svelte";
    import ABTester from "../../components/standalone/ABTester.svelte";
    import { trackA, trackB } from "../../stores/ABTestStore";

    // stream: the playing track. A | B: the two tracks being compared.
    $: pageTitle =
        $audioMode === "abTester"
            ? $trackA && $trackB
                ? `${$trackA.beatTitle} vs ${$trackB.beatTitle}`
                : "A | B Tester"
            : $selectedBeat?.beatTitle || "Listen";

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
                formatTrackMeta($selectedBeat) ||
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
    <title>{pageTitle}</title>
</svelte:head>

{#if $isFetchingBeats && !$oneBeatFetchSuccessfull}
    <Loader loaderStyle={"loader_full"} />
{:else if $beatFetchError}
    <div class="portal_fetchError">
        <ErrorNotice
            message={$beatFetchError}
            title="Couldn't load your tracks"
            onRetry={() => fetchBeats()}
        />
    </div>
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
    /* below the fixed nav, centered on the page */
    .portal_fetchError {
        padding: 140px 15px 60px;
    }

    .wrapTrackList {
        margin: auto;
        padding: 25px;
        max-width: var(--site-width);
    }

    @media (max-width: 575px) {
        .wrapTrackList {
            margin: auto;
            max-width: var(--site-width);
            padding: 0px 15px;
        }
    }
</style>
