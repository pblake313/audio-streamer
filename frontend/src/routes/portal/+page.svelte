<script lang="ts">
    import { onMount } from 'svelte';
    import HighlightedTrack from '../../components/standalone/HighlightedTrack.svelte';
    import { beatFetchError, fetchBeats, fetchBeatsAttempted, isFetchingBeats } from '../../stores/AudioPlayer/beatArrayStore';
    import { selectedBeat } from '../../stores/AudioPlayer/selectedBeatStore';
    import { pauseTrack, playTrack, smartNextTrack, smartPreviousTrack } from '../../stores/AudioPlayerStore';
    import { navStyle } from '../../stores/navstore';
    import { get } from 'svelte/store';
    import { pushNotification } from '../../stores/NotificationStore';
    import SpinLoader from '../../components/loaders/Loader.svelte';
    import TrackList from '../../components/lists/TrackList/TrackList.svelte';
    import Loader from '../../components/loaders/Loader.svelte';


    let fetchBeatsErrorOccurred: boolean = false

    // This reactive block runs every time $selectedBeat changes.
    $: if (typeof navigator !== 'undefined' && navigator.mediaSession && $selectedBeat) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: $selectedBeat.beatTitle,
            artist: "PATTSWAY",
            album: `${$selectedBeat.bpm} BPM - ${$selectedBeat.key} ${$selectedBeat.mode}` || "Unknown Album",
            artwork: [
            {
                src: $selectedBeat.artworkUrl,
                sizes: '512x512', // optional, specify if known
                type: 'image/png'  // optional, specify the MIME type
            }
            ]
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


    onMount( async()=> {
        navStyle.set({style:'standard', capWidth: true, addLine: false})

        await fetchBeats()

    })


</script>

<svelte:head>
    <title>{$selectedBeat?.beatTitle || 'Listen'}</title>
</svelte:head>


<style>
    .wrapTrackList {
        margin: auto;
        padding: 25px;
        max-width: 1550px;
    }
    @media (max-width:575px){
            .wrapTrackList {
            margin: auto;
            padding: 15px;
            max-width: 1550px;
        }
    }
</style>




{#if $isFetchingBeats}
    <Loader loaderStyle={"loader_full"}/>
{:else if $beatFetchError}
    <p>{$beatFetchError}</p>
{:else}
    <HighlightedTrack></HighlightedTrack>
    <div class="wrapTrackList">
        <TrackList></TrackList>
    </div>
{/if}







