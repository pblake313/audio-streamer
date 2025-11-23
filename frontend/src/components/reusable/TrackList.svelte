<script lang="ts">
    import { fade } from 'svelte/transition';
    import TightButton from '../buttons/TightButton.svelte';
    import { allBeatPagesFetched, beats, fetchBeats, getNextBeatPageToFetch } from '../../stores/AudioPlayer/beatArrayStore';

    import './Tracklist.css'
    import SpinLoader from './Loaders/SpinLoader.svelte';
    import AddTrackPointer from '../pointers/AddTrackPointer.svelte';
    import TrackListItem from '../list-items/Tracks/TrackListItem.svelte';
    import { audioPlayerState } from '../../stores/AudioPlayerStore';


    let loadingNewBeats: boolean = false


    async function loadMoreBeats(){
        // console.log($beatPagesFetched)
        if ($allBeatPagesFetched){
            // console.log('Already fetched all beat pages!')
            return
        }

        loadingNewBeats = true

        try {
            await fetchBeats(getNextBeatPageToFetch())
            loadingNewBeats = false

        } catch {
            console.log('an error fetching public beats...')
            loadingNewBeats = false
             
        }

        
    }

</script>


    {#if $beats.length === 0}
        <AddTrackPointer />
    {:else}
        {#each $beats as beat, i}
            <TrackListItem {beat} isEven={i % 2 === 0}></TrackListItem>
        {/each}
    {/if}
    



    {#if !$allBeatPagesFetched}
        <div class="wrapOnlyButton">
            {#if loadingNewBeats}
                <SpinLoader></SpinLoader>
                {:else}
                <div in:fade={{duration: 500, delay: 500}}>
                    <TightButton buttonText={'Fetch More'} on:click={loadMoreBeats}></TightButton>
                </div>
            {/if}
        </div>
    {/if}



<p>{$audioPlayerState}</p>

