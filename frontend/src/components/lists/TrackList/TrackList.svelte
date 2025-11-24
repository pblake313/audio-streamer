<script lang="ts">
    import { fade } from "svelte/transition";

    import "./Tracklist.css";
    import { allBeatPagesFetched, beats, fetchBeats, getNextBeatPageToFetch } from "../../../stores/AudioPlayer/beatArrayStore";
    import AddTrackPointer from "../../page-components/AddTrackPointer.svelte";
    import TrackListItem from "../../list-items/Tracks/TrackListItem.svelte";
    import BoxButton from "../../buttons/BoxButton.svelte";
    import SpinLoader from "../../loaders/SpinLoader.svelte";

    let loadingNewBeats: boolean = false;

    async function loadMoreBeats() {
        // console.log($beatPagesFetched)
        if ($allBeatPagesFetched) {
            // console.log('Already fetched all beat pages!')
            return;
        }

        loadingNewBeats = true;

        try {
            await fetchBeats(getNextBeatPageToFetch());
        } finally {
            loadingNewBeats = false;
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
            <div in:fade={{duration: 300, delay: 200}}>
                <SpinLoader></SpinLoader>
            </div>
        {:else}
            <div in:fade={{ duration: 500, delay: 200 }} out:fade={{duration: 200}}>
                <BoxButton tightPad={true} buttonText={'Fetch More'} on:click={loadMoreBeats}></BoxButton>
            </div>
        {/if}
    </div>
{/if}

