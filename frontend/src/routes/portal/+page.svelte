<script lang="ts">
    import { onMount } from 'svelte';
    import FullPageLoader from '../../components/reusable/Loaders/PageLoaders/FullPageLoader.svelte';
    import TrackList from '../../components/reusable/TrackList.svelte';
    import HighlightedTrack from '../../components/standalone/HighlightedTrack.svelte';
    import { fetchBeats, fetchBeatsAttempted } from '../../stores/AudioPlayer/beatArrayStore';
    import { selectedBeat } from '../../stores/AudioPlayer/selectedBeatStore';
    import { pauseTrack, playTrack, smartNextTrack, smartPreviousTrack } from '../../stores/AudioPlayerStore';
    import { navStyle } from '../../stores/navstore';
    import { get } from 'svelte/store';
    import { pushNotification } from '../../stores/NotificationStore';
    import SpinLoader from '../../components/reusable/Loaders/SpinLoader.svelte';


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

        try {

            const beatFetchAttemtpted = get(fetchBeatsAttempted)

            if (!beatFetchAttemtpted){
                await fetchBeats()
            }

        } catch {
            fetchBeatsErrorOccurred = true
            pushNotification("There was an error that occurred when fetching beats.", 'Error', false, 6000, 'Fetch Beats Error')
        } finally {

        }

    })


</script>

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


{#if !$fetchBeatsAttempted}
    <SpinLoader></SpinLoader>
{:else}
    {#if !fetchBeatsErrorOccurred}
        <HighlightedTrack></HighlightedTrack>
        <div class="wrapTrackList">
            <TrackList></TrackList>
        </div>
        <div style="height: 100px;"></div>
    {:else}
        <p>There was an error while fetching beats</p>
    {/if}


{/if}


