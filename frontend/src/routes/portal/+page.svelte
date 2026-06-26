<script lang="ts">
    import { onMount } from 'svelte';
    import HighlightedTrack from '../../components/standalone/HighlightedTrack.svelte';
    import { beatFetchError, beats, fetchBeats,  isFetchingBeats, oneBeatFetchSuccessfull } from '../../stores/AudioPlayer/BeatsStore';
    import { selectedBeat } from '../../stores/AudioPlayer/selectedBeatStore';
    import { pauseTrack, playTrack, smartNextTrack, smartPreviousTrack } from '../../stores/AudioPlayerStore';
    import TrackList from '../../components/lists/TrackList/TrackList.svelte';
    import Loader from '../../components/loaders/Loader.svelte';
    import PageHeading from '../../components/page-components/PageHeading.svelte';


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

    $: console.log($beats)

    onMount( async()=> {

        if (!$oneBeatFetchSuccessfull){
            await fetchBeats()
        }

    })


</script>

<svelte:head>
    <title>{$selectedBeat?.beatTitle || 'Listen'}</title>
</svelte:head>


<style>
    .wrapTrackList {
        margin: auto;
        padding: 25px;
        max-width: 1250px;
    }
    @media (max-width:575px){
            .wrapTrackList {
            margin: auto;
            padding: 15px;
            max-width: 1250px;
        }
    }
</style>




{#if $isFetchingBeats}
    <Loader loaderStyle={"loader_full"}/>
{:else if $beatFetchError}
    <PageHeading title={"Fetch Beats Error"} subtitle={$beatFetchError} buttonText={"Retry"} onButtonClick={() => {
        fetchBeats()
    }}/>
{:else}
    <HighlightedTrack />
    <div class="wrapTrackList">
        <TrackList></TrackList>
    </div>
{/if}







