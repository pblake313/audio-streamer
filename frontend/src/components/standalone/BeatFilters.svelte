<script lang="ts">
    import {
        afterUpdate,
        onDestroy,
        onMount,
    } from "svelte";

    import {
        artistFilter,
        beatTypeFilter,
        clearAllFilters,
        clearArtistFilter,
        clearBeatTypeFilter,
        clearMoodFilter,
        clearTagFilter,
        fetchBeatsWithFilters,
        moodFilter,
        tagFilter,
    } from "../../stores/AudioPlayer/BeatsStore";

    import CloseIcon from "../Icons/svg/CloseIcon.svelte";
    import "./BeatFilters.css";

    let scrollEl: HTMLDivElement;

    let isDragging = false;
    let isBlockingClicks = false;

    let canScrollLeft = false;
    let canScrollRight = false;

    let activePointerId: number | null = null;

    let startX = 0;
    let startScrollLeft = 0;

    let clickBlockTimeout: number | null = null;
    let fadeAnimationFrame: number | null = null;

    let resizeObserver: ResizeObserver | null = null;

    const DRAG_THRESHOLD = 5;
    const SCROLL_EDGE_TOLERANCE = 2;

    $: activeFilterCount = [
        $moodFilter.length > 0,
        $tagFilter.length > 0,
        $artistFilter.length > 0,
        $beatTypeFilter.length > 0,
    ].filter(Boolean).length;

    /*
     * Fetch whenever at least one filter is active.
     */
    $: if (
        $moodFilter.length >= 1 ||
        $tagFilter.length >= 1 ||
        $artistFilter.length >= 1 ||
        $beatTypeFilter.length >= 1
    ) {
        fetchBeatsWithFilters();
    }

    function updateScrollFades() {
        if (!scrollEl) {
            return;
        }

        const maxScrollLeft =
            scrollEl.scrollWidth - scrollEl.clientWidth;

        canScrollLeft =
            scrollEl.scrollLeft > SCROLL_EDGE_TOLERANCE;

        canScrollRight =
            maxScrollLeft > SCROLL_EDGE_TOLERANCE &&
            scrollEl.scrollLeft <
                maxScrollLeft - SCROLL_EDGE_TOLERANCE;
    }

    /*
     * Prevent the scroll event from causing multiple
     * Svelte updates during the same animation frame.
     */
    function scheduleScrollFadeUpdate() {
        if (fadeAnimationFrame !== null) {
            return;
        }

        fadeAnimationFrame = requestAnimationFrame(() => {
            fadeAnimationFrame = null;
            updateScrollFades();
        });
    }

    /*
     * Touch devices use native browser scrolling.
     * Custom dragging is only enabled for a mouse.
     */
    function handlePointerDown(event: PointerEvent) {
        if (
            event.pointerType !== "mouse" ||
            event.button !== 0
        ) {
            return;
        }

        if (clickBlockTimeout !== null) {
            window.clearTimeout(clickBlockTimeout);
            clickBlockTimeout = null;
        }

        activePointerId = event.pointerId;

        startX = event.clientX;
        startScrollLeft = scrollEl.scrollLeft;

        isDragging = false;
        isBlockingClicks = false;

        scrollEl.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
        if (
            event.pointerType !== "mouse" ||
            event.pointerId !== activePointerId
        ) {
            return;
        }

        const distanceX = event.clientX - startX;

        if (
            !isDragging &&
            Math.abs(distanceX) < DRAG_THRESHOLD
        ) {
            return;
        }

        isDragging = true;
        isBlockingClicks = true;

        event.preventDefault();

        scrollEl.scrollLeft =
            startScrollLeft - distanceX;

        scheduleScrollFadeUpdate();
    }

    function handlePointerEnd(event: PointerEvent) {
        if (event.pointerId !== activePointerId) {
            return;
        }

        const dragged = isDragging;

        if (scrollEl.hasPointerCapture(event.pointerId)) {
            scrollEl.releasePointerCapture(event.pointerId);
        }

        activePointerId = null;
        isDragging = false;

        if (clickBlockTimeout !== null) {
            window.clearTimeout(clickBlockTimeout);
        }

        if (dragged) {
            clickBlockTimeout = window.setTimeout(() => {
                isBlockingClicks = false;
                clickBlockTimeout = null;
            }, 100);
        } else {
            isBlockingClicks = false;
            clickBlockTimeout = null;
        }

        scheduleScrollFadeUpdate();
    }

    function handleFilterClick(
        event: MouseEvent,
        clearFilter: () => void,
    ) {
        if (isBlockingClicks) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        clearFilter();
    }

    onMount(() => {
        updateScrollFades();

        resizeObserver = new ResizeObserver(() => {
            scheduleScrollFadeUpdate();
        });

        resizeObserver.observe(scrollEl);

        scheduleScrollFadeUpdate();
    });

    afterUpdate(() => {
        scheduleScrollFadeUpdate();
    });

    onDestroy(() => {
        if (clickBlockTimeout !== null) {
            window.clearTimeout(clickBlockTimeout);
        }

        if (fadeAnimationFrame !== null) {
            cancelAnimationFrame(fadeAnimationFrame);
        }

        resizeObserver?.disconnect();
    });
</script>

<div
    class="beatFilters_wrapper"
    class:canScrollLeft
    class:canScrollRight
>
    <!--
        svelte-ignore a11y_no_static_element_interactions
    -->
    <div
        bind:this={scrollEl}
        class="beatFilters_flex"
        class:isDragging
        class:isBlockingClicks
        on:scroll={scheduleScrollFadeUpdate}
        on:pointerdown={handlePointerDown}
        on:pointermove={handlePointerMove}
        on:pointerup={handlePointerEnd}
        on:pointercancel={handlePointerEnd}
    >
        {#if $moodFilter.length >= 1}
            <button
                type="button"
                class="beatFilters_button"
                on:click={(event) =>
                    handleFilterClick(
                        event,
                        clearMoodFilter,
                    )}
            >
                <span class="beatFilter_iconContainer">
                    <span class="beatFilter_icon">
                        <CloseIcon height="16px" />
                    </span>
                </span>

                <span class="beatFilter_text">
                    {$moodFilter.join(", ")}
                </span>
            </button>
        {/if}

        {#if $tagFilter.length >= 1}
            <button
                type="button"
                class="beatFilters_button"
                on:click={(event) =>
                    handleFilterClick(
                        event,
                        clearTagFilter,
                    )}
            >
                <span class="beatFilter_iconContainer">
                    <span class="beatFilter_icon">
                        <CloseIcon height="16px" />
                    </span>
                </span>

                <span class="beatFilter_text">
                    {$tagFilter.join(", ")}
                </span>
            </button>
        {/if}

        {#if $artistFilter.length >= 1}
            <button
                type="button"
                class="beatFilters_button"
                on:click={(event) =>
                    handleFilterClick(
                        event,
                        clearArtistFilter,
                    )}
            >
                <span class="beatFilter_iconContainer">
                    <span class="beatFilter_icon">
                        <CloseIcon height="16px" />
                    </span>
                </span>

                <span class="beatFilter_text">
                    {$artistFilter.join(", ")}
                </span>
            </button>
        {/if}

        {#if $beatTypeFilter.length >= 1}
            <button
                type="button"
                class="beatFilters_button"
                on:click={(event) =>
                    handleFilterClick(
                        event,
                        clearBeatTypeFilter,
                    )}
            >
                <span class="beatFilter_iconContainer">
                    <span class="beatFilter_icon">
                        <CloseIcon height="16px" />
                    </span>
                </span>

                <span class="beatFilter_text">
                    {$beatTypeFilter.join(", ")}
                </span>
            </button>
        {/if}

        {#if activeFilterCount >= 2}
            <button
                type="button"
                class="
                    beatFilters_button
                    beatFilters_lastButton
                "
                on:click={(event) =>
                    handleFilterClick(
                        event,
                        clearAllFilters,
                    )}
            >
                <span class="beatFilter_iconContainer">
                    <span class="beatFilter_icon">
                        <CloseIcon height="16px" />
                    </span>
                </span>

                <span class="beatFilter_text">
                    Clear All Filters
                </span>
            </button>
        {/if}
    </div>
</div>
