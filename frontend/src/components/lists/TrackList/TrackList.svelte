<script lang="ts">
    import "./Tracklist.css";
    import {
        allBeatPagesFetched,
        allFilteredBeatPagesFetched,
        artistFilter,
        beats,
        beatTypeFilter,
        fetchBeats,
        fetchBeatsWithFilters,
        fetchFilteredBeatsError,
        filteredBeats,
        getNextBeatPageToFetch,
        isFetchingBeats,
        isFetchingFilteredBeats,
        moodFilter,
        tagFilter,
    } from "../../../stores/AudioPlayer/BeatsStore";
    import AddTrackPointer from "../../page-components/AddTrackPointer.svelte";
    import TrackListItem from "../../list-items/Tracks/TrackListItem.svelte";
    import BoxButton from "../../buttons/BoxButton.svelte";
    import BeatFilters from "../../standalone/BeatFilters.svelte";
    import {
        audioMode,
        toggleAudioMode,
    } from "../../../stores/AudioPlayerStore";
    import ABIcon from "../../Icons/svg/ABIcon.svelte";
    import StreamIcon from "../../Icons/svg/StreamIcon.svelte";
    import Loader from "../../loaders/Loader.svelte";

    async function loadMoreBeats() {
        // console.log($beatPagesFetched)
        await fetchBeats(getNextBeatPageToFetch());
    }

    async function loadMoreFilteredBeats() {
        await fetchBeatsWithFilters();
    }

</script>

{#if $beats.length === 0}
    <AddTrackPointer />
{:else}
    <div class="trackList_filtersModeFlex">
        <div class="trackList_filters">
            <BeatFilters />
        </div>

        <div class="trackList_modeToggler">
            <button
                class="trackList_modeToggleButton"
                on:click={toggleAudioMode}
            >
                {#if $audioMode === "abTester"}
                    <StreamIcon height={"22px"} />
                {:else}
                    <ABIcon height={"18px"} />
                {/if}
            </button>
        </div>
    </div>

    {#if $filteredBeats.length >= 1}
        {#each $filteredBeats as beat, i}
            <TrackListItem {beat} isEven={i % 2 === 0} />
        {/each}
    {:else}
        <p>no filtered beats.</p>
    {/if}
{/if}

{#if $moodFilter.length >= 1 || $tagFilter.length >= 1 || $artistFilter.length >= 1 || $beatTypeFilter.length >= 1}

    {#if !$allFilteredBeatPagesFetched}
        <div class="wrapOnlyButton">
            <BoxButton
                tightPad={true}
                buttonText={$isFetchingFilteredBeats ? null : "Fetch More"}
                buttonIcon={$isFetchingFilteredBeats ? "loading" : null}
                isDisabled={$isFetchingFilteredBeats}
                on:click={loadMoreFilteredBeats}
            />
        </div>
    {/if}

    {#if $fetchFilteredBeatsError}
        <p style="color: red;">
            {$fetchFilteredBeatsError}
        </p>
    {/if}

{:else}
    <!-- no filters set, use standard pagination. -->
    {#if !$allBeatPagesFetched}
        <div class="wrapOnlyButton">
            <BoxButton
                tightPad={true}
                buttonText={$isFetchingBeats ? null : "Fetch More"}
                buttonIcon={$isFetchingBeats ? "loading" : null}
                isDisabled={$isFetchingBeats}
                on:click={loadMoreBeats}
            />
        </div>
    {/if}
{/if}
