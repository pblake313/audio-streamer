<script lang="ts">
    import "./Tracklist.css";
    import {
        allBeatPagesFetched,
        allFilteredBeatPagesFetched,
        artistFilter,
        beatFetchError,
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
        setTrackTypeView,
        showTrash,
        tagFilter,
        trackTypeView,
        type TrackTypeView,
    } from "../../../stores/AudioPlayer/BeatsStore";
    import AddTrackPointer from "../../page-components/AddTrackPointer.svelte";
    import TrackListItem from "../../list-items/Tracks/TrackListItem.svelte";
    import Loader from "../../loaders/Loader.svelte";
    import BeatFilters from "../../standalone/BeatFilters.svelte";
    import FloatingMultiSelect from "../../form-inputs/select/FloatingMultiSelect.svelte";
    import {
        audioMode,
        setAudioMode,
    } from "../../../stores/AudioPlayerStore";

    // one multi-select drives both the track type view and trash visibility
    const viewOptions = [
        { value: "Beat", label: "Beats" },
        { value: "Reference", label: "References" },
        { value: "Trash", label: "Trash" },
    ];

    $: showsBeats = $trackTypeView !== "Reference";
    $: showsReferences = $trackTypeView !== "Beat";

    $: viewValues = [
        ...(showsBeats ? ["Beat"] : []),
        ...(showsReferences ? ["Reference"] : []),
        ...($showTrash ? ["Trash"] : []),
    ];

    // at least one of Beats / References has to stay checked
    $: lockedViewValues = $trackTypeView === "All" ? [] : [$trackTypeView];

    $: viewLabel =
        viewValues.length === viewOptions.length
            ? "All tracks"
            : viewOptions
                  .filter((option) => viewValues.includes(option.value))
                  .map((option) => option.label)
                  .join(", ");

    function handleViewToggle(value: string) {
        if (value === "Trash") {
            showTrash.update((current) => !current);
            return;
        }

        const beats = value === "Beat" ? !showsBeats : showsBeats;
        const references = value === "Reference" ? !showsReferences : showsReferences;

        const view: TrackTypeView =
            beats && references ? "All"
            : beats ? "Beat"
            : "Reference";

        setTrackTypeView(view);
    }

    $: viewNoun =
        $trackTypeView === "Reference" ? "references"
        : $trackTypeView === "Beat" ? "beats"
        : "tracks";

    // "Beats" or "References" filters on the server; "Both" uses the unfiltered path
    $: usingFilters =
        $moodFilter.length >= 1 ||
        $tagFilter.length >= 1 ||
        $artistFilter.length >= 1 ||
        $beatTypeFilter.length >= 1;

    // mood / tag / artist pills (the track type view isn't shown as a pill)
    $: hasActiveFilters =
        $moodFilter.length >= 1 ||
        $tagFilter.length >= 1 ||
        $artistFilter.length >= 1;

    $: isFetchingMore = usingFilters ? $isFetchingFilteredBeats : $isFetchingBeats;
    $: allPagesFetched = usingFilters ? $allFilteredBeatPagesFetched : $allBeatPagesFetched;
    $: activeFetchError = usingFilters ? $fetchFilteredBeatsError : $beatFetchError;

    let sentinelVisible = false;

    /*
     * Keep loading while the sentinel stays near the viewport. This
     * re-runs when a fetch finishes, so a short page (e.g. with trash
     * hidden) keeps filling until the list reaches past the screen.
     * Errors pause it; the filtered error clears itself after a few
     * seconds, which acts as a retry.
     */
    $: if (sentinelVisible && !isFetchingMore && !allPagesFetched && !activeFetchError) {
        loadMore();
    }

    function loadMore() {
        if (usingFilters) {
            fetchBeatsWithFilters();
        } else {
            fetchBeats(getNextBeatPageToFetch());
        }
    }

    function observeSentinel(node: HTMLElement) {
        const observer = new IntersectionObserver(
            ([entry]) => {
                sentinelVisible = entry.isIntersecting;
            },
            { rootMargin: "0px 0px 600px 0px" }
        );

        observer.observe(node);

        return {
            destroy() {
                observer.disconnect();
                sentinelVisible = false;
            },
        };
    }
</script>

<div class="trackList_megaWrap">
    {#if $beats.length === 0}
        <AddTrackPointer />
    {:else}
        <div class="trackList_filtersModeFlex">
            <div class="trackList_viewSelects">
                <FloatingMultiSelect
                    ariaLabel="Show"
                    label={viewLabel}
                    options={viewOptions}
                    values={viewValues}
                    lockedValues={lockedViewValues}
                    tone={$showTrash ? "danger" : "default"}
                    onToggle={handleViewToggle}
                />
            </div>

            <div class="trackList_filters" class:trackList_filters_empty={!hasActiveFilters}>
                <BeatFilters />
            </div>

            <div class="trackList_modeToggler">
                <div class="trackList_typeToggle" role="group" aria-label="Player mode">
                    <button
                        type="button"
                        class="trackList_typeOption"
                        class:trackList_typeOption_active={$audioMode === "streamer"}
                        aria-pressed={$audioMode === "streamer"}
                        on:click={() => setAudioMode("streamer")}
                    >
                        Stream
                    </button>
                    <button
                        type="button"
                        class="trackList_typeOption"
                        class:trackList_typeOption_active={$audioMode === "abTester"}
                        aria-pressed={$audioMode === "abTester"}
                        on:click={() => setAudioMode("abTester")}
                    >
                        A | B
                    </button>
                </div>
            </div>
        </div>

        {#if $filteredBeats.length >= 1}
            {#each $filteredBeats as beat, i}
                <TrackListItem {beat} isEven={i % 2 === 0} />
            {/each}
        {:else if !isFetchingMore}
            <p class="trackList_empty">
                {#if $moodFilter.length >= 1 || $tagFilter.length >= 1 || $artistFilter.length >= 1}
                    No {viewNoun} match these filters.
                {:else}
                    No {viewNoun} yet.
                {/if}
            </p>
        {/if}
    {/if}

    {#if $beats.length > 0}
        <!-- infinite scroll: load the next page as this nears the viewport -->
        <div class="trackList_sentinel" use:observeSentinel></div>

        {#if isFetchingMore}
            <div class="trackList_loadingMore">
                <Loader height={"28px"} />
            </div>
        {/if}

        {#if activeFetchError}
            <p class="trackList_fetchError">{activeFetchError}</p>
        {/if}
    {/if}
</div>
