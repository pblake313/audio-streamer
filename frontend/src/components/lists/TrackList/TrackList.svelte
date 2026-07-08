<script lang="ts">
    import "./Tracklist.css";
    import { allBeatPagesFetched, beats, fetchBeats, filteredBeats, getNextBeatPageToFetch, isFetchingBeats } from "../../../stores/AudioPlayer/BeatsStore";
    import AddTrackPointer from "../../page-components/AddTrackPointer.svelte";
    import TrackListItem from "../../list-items/Tracks/TrackListItem.svelte";
    import BoxButton from "../../buttons/BoxButton.svelte";
    import BeatFilters from "../../standalone/BeatFilters.svelte";
    import { audioMode, toggleAudioMode } from "../../../stores/AudioPlayerStore";


    async function loadMoreBeats() {
        // console.log($beatPagesFetched)
        await fetchBeats(getNextBeatPageToFetch());
    }
</script>


{#if $beats.length === 0}
    <AddTrackPointer /> 
{:else}
    <BeatFilters />

    <BoxButton 
        buttonStyle={"opacityIncrease"}
        noPad={true}
        buttonText={$audioMode === 'abTester' ? 'Stream' : 'A | B'}
        on:click={toggleAudioMode}
    />

    {#each $beats as beat, i}
        <TrackListItem {beat} isEven={i % 2 === 0}/>
    {/each}
{/if}

{#if !$allBeatPagesFetched}
    <div class="wrapOnlyButton">

        <BoxButton 
            tightPad={true} 
            buttonText={$isFetchingBeats ? null : 'Fetch More'} 
            buttonIcon={$isFetchingBeats ? 'loading' : null}
            isDisabled={$isFetchingBeats} 
            on:click={loadMoreBeats} 
        />

    </div>
{/if}

