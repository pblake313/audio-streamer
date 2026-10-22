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
        noTrackTypes,
        searchQuery,
        searchActive,
        isSearchingBeats,
        searchBeatsError,
        searchHasMore,
        searchBeatsOnServer,
        type TrackTypeView,
    } from "../../../stores/AudioPlayer/BeatsStore";
    import { onDestroy, onMount } from "svelte";
    import AddTrackPointer from "../../page-components/AddTrackPointer.svelte";
    import ErrorNotice from "../../errors/ErrorNotice.svelte";
    import TrackListItem from "../../list-items/Tracks/TrackListItem.svelte";
    import Loader from "../../loaders/Loader.svelte";
    import BeatFilters from "../../standalone/BeatFilters.svelte";
    import FloatingMultiSelect from "../../form-inputs/select/FloatingMultiSelect.svelte";
    import {
        audioMode,
        setAudioMode,
    } from "../../../stores/AudioPlayerStore";

    // ---------------------------------------------
    // search
    // The list narrows right away from loaded tracks; the server's
    // matches (from every track) arrive shortly after typing stops.
    // ---------------------------------------------
    let searchText = $searchQuery;
    let searchTimer: ReturnType<typeof setTimeout> | null = null;

    function handleSearchInput() {
        searchQuery.set(searchText);

        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => searchBeatsOnServer(searchText), 250);
    }

    function clearSearch() {
        searchText = "";
        handleSearchInput();
    }

    function handleSearchKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && searchText) {
            event.preventDefault();
            clearSearch();
        }
    }

    onDestroy(() => {
        if (searchTimer) clearTimeout(searchTimer);
    });

    // ---------------------------------------------
    // sticky toolbar / search: stick right under the fixed nav, using its
    // real height (it differs between desktop and phones) so there's no gap
    // ---------------------------------------------
    let megaWrapEl: HTMLDivElement;
    let searchEl: HTMLDivElement;

    // true while the bar is stuck under the nav; it then paints a solid
    // full-width band up to the nav so nothing shows around or above it
    let isStuck = false;
    let stickyTop = 68;

    function checkStuck() {
        if (!searchEl) return;

        // phones: the search itself sticks; desktop: the toolbar it sits in
        const sticky = window.matchMedia("(max-width: 700px)").matches
            ? searchEl
            : (searchEl.parentElement ?? searchEl);

        isStuck = sticky.getBoundingClientRect().top <= stickyTop + 1;
    }

    onMount(() => {
        const nav = document.querySelector<HTMLElement>(".nav_container");

        const updateTop = () => {
            stickyTop = nav?.offsetHeight ?? 68;
            megaWrapEl?.style.setProperty("--trackList-sticky-top", `${stickyTop}px`);
            checkStuck();
        };

        updateTop();

        const observer = nav ? new ResizeObserver(updateTop) : null;
        if (nav) observer?.observe(nav);

        let frame = 0;
        const onScroll = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                checkStuck();
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);

        return () => {
            observer?.disconnect();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            cancelAnimationFrame(frame);
        };
    });

    // switching Stream / A | B swaps the player at the top, so jump up to it
    function switchMode(mode: "streamer" | "abTester") {
        if ($audioMode === mode) return;

        setAudioMode(mode);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // one multi-select drives both the track type view and trash visibility
    const viewOptions = [
        { value: "Beat", label: "Beats" },
        { value: "Reference", label: "References" },
        { value: "Trash", label: "Trash" },
    ];

    $: showsBeats = !$noTrackTypes && $trackTypeView !== "Reference";
    $: showsReferences = !$noTrackTypes && $trackTypeView !== "Beat";

    $: viewValues = [
        ...(showsBeats ? ["Beat"] : []),
        ...(showsReferences ? ["Reference"] : []),
        ...($showTrash ? ["Trash"] : []),
    ];

    $: viewLabel =
        viewValues.length === 0 ? "Nothing selected"
        : viewValues.length === 1 && $showTrash ? "Trash only"
        : viewValues.length === viewOptions.length ? "All tracks"
        : viewOptions
              .filter((option) => viewValues.includes(option.value))
              .map((option) => option.label)
              .join(", ");

    // every option toggles freely, in any order
    function handleViewToggle(value: string) {
        if (value === "Trash") {
            showTrash.update((current) => !current);
            return;
        }

        const beats = value === "Beat" ? !showsBeats : showsBeats;
        const references = value === "Reference" ? !showsReferences : showsReferences;

        // neither type: trashed tracks only (or nothing, if trash is off)
        if (!beats && !references) {
            noTrackTypes.set(true);
            setTrackTypeView("All");
            return;
        }

        noTrackTypes.set(false);

        const view: TrackTypeView =
            beats && references ? "All"
            : beats ? "Beat"
            : "Reference";

        setTrackTypeView(view);
    }

    $: viewNoun =
        $noTrackTypes ? "trashed tracks"
        : $trackTypeView === "Reference" ? "references"
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
    // nothing selected: the list is empty on purpose, so don't keep paging
    $: nothingSelected = $noTrackTypes && !$showTrash;

    // searching: every match is already loaded, so don't page either
    $: if (sentinelVisible && !nothingSelected && !$searchActive && !isFetchingMore && !allPagesFetched && !activeFetchError) {
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

<div class="trackList_megaWrap" class:trackList_stuck={isStuck} bind:this={megaWrapEl}>
    {#if $beats.length === 0}
        <AddTrackPointer />
    {:else}
        <div class="trackList_filtersModeFlex">
            <!-- search every track -->
            <div class="trackList_search" class:trackList_search_active={$searchActive} bind:this={searchEl}>
                <svg
                    class="trackList_searchIcon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    aria-hidden="true"
                >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                </svg>

                <input
                    type="search"
                    class="trackList_searchInput"
                    placeholder="Search tracks"
                    aria-label="Search tracks"
                    autocomplete="off"
                    spellcheck="false"
                    bind:value={searchText}
                    on:input={handleSearchInput}
                    on:keydown={handleSearchKeydown}
                />

                {#if $isSearchingBeats}
                    <span class="trackList_searchSpinner" aria-label="Searching"></span>
                {/if}

                {#if searchText}
                    <button
                        type="button"
                        class="trackList_searchClear"
                        aria-label="Clear search"
                        on:click={clearSearch}
                    >
                        <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true">
                            <path
                                d="M6 6l12 12M18 6L6 18"
                                stroke="currentColor"
                                stroke-width="2.4"
                                stroke-linecap="round"
                            />
                        </svg>
                    </button>
                {/if}
            </div>

            <div class="trackList_filters" class:trackList_filters_empty={!hasActiveFilters}>
                <BeatFilters />
            </div>

            <!-- view menu sits right next to the Stream / A | B toggle -->
            <div class="trackList_modeToggler">
                <FloatingMultiSelect
                    ariaLabel="Show"
                    label={viewLabel}
                    options={viewOptions}
                    values={viewValues}
                    tone="default"
                    onToggle={handleViewToggle}
                />

                <div class="trackList_typeToggle" role="group" aria-label="Player mode">
                    <button
                        type="button"
                        class="trackList_typeOption"
                        class:trackList_typeOption_active={$audioMode === "streamer"}
                        aria-pressed={$audioMode === "streamer"}
                        on:click={() => switchMode("streamer")}
                    >
                        Stream
                    </button>
                    <button
                        type="button"
                        class="trackList_typeOption"
                        class:trackList_typeOption_active={$audioMode === "abTester"}
                        aria-pressed={$audioMode === "abTester"}
                        on:click={() => switchMode("abTester")}
                    >
                        A | B
                    </button>
                </div>
            </div>
        </div>

        {#if $searchBeatsError}
            <div class="trackList_fetchError">
                <ErrorNotice message={$searchBeatsError} title="Search failed" />
            </div>
        {/if}

        {#if $filteredBeats.length >= 1}
            {#each $filteredBeats as beat, i}
                <TrackListItem {beat} isEven={i % 2 === 0} />
            {/each}

            {#if $searchActive && $searchHasMore && !$isSearchingBeats}
                <p class="trackList_searchMore">
                    Showing the most recent matches. Add another word to narrow it down.
                </p>
            {/if}
        {:else if $searchActive && $isSearchingBeats}
            <p class="trackList_empty">Searching…</p>
        {:else if !isFetchingMore}
            <p class="trackList_empty">
                {#if $searchActive}
                    No {viewNoun} match “{$searchQuery.trim()}”.
                {:else if $noTrackTypes && !$showTrash}
                    Nothing selected. Pick Beats, References, or Trash.
                {:else if $moodFilter.length >= 1 || $tagFilter.length >= 1 || $artistFilter.length >= 1}
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
            <div class="trackList_fetchError">
                <ErrorNotice message={activeFetchError} title="Couldn't load more tracks" />
            </div>
        {/if}
    {/if}
</div>
