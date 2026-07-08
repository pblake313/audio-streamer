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
        fetchFilteredBeatsError,
        filteredBeats,
        moodFilter,
        tagFilter,
    } from "../../stores/AudioPlayer/BeatsStore";

    import CloseIcon from "../Icons/svg/CloseIcon.svelte";
    import "./BeatFilters.css";

    type GestureDirection =
        | "horizontal"
        | "vertical"
        | null;

    let scrollEl: HTMLDivElement;

    let isDragging = false;
    let isBlockingClicks = false;

    let canScrollLeft = false;
    let canScrollRight = false;

    let activePointerId: number | null = null;
    let activePointerType: string | null = null;

    let gestureDirection: GestureDirection = null;

    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;

    let clickBlockTimeout: ReturnType<typeof setTimeout>;
    let resizeObserver: ResizeObserver | null = null;

    const DIRECTION_THRESHOLD = 6;
    const SCROLL_EDGE_TOLERANCE = 2;

    $: activeFilterCount = [
        $moodFilter.length > 0,
        $tagFilter.length > 0,
        $artistFilter.length > 0,
        $beatTypeFilter.length > 0,
    ].filter(Boolean).length;

    function updateScrollFades() {
        if (!scrollEl) return;

        const maxScrollLeft =
            scrollEl.scrollWidth - scrollEl.clientWidth;

        canScrollLeft =
            scrollEl.scrollLeft > SCROLL_EDGE_TOLERANCE;

        canScrollRight =
            maxScrollLeft > SCROLL_EDGE_TOLERANCE &&
            scrollEl.scrollLeft <
                maxScrollLeft - SCROLL_EDGE_TOLERANCE;
    }

    function handlePointerDown(event: PointerEvent) {
        if (
            event.pointerType === "mouse" &&
            event.button !== 0
        ) {
            return;
        }

        clearTimeout(clickBlockTimeout);

        activePointerId = event.pointerId;
        activePointerType = event.pointerType;

        gestureDirection = null;

        startX = event.clientX;
        startY = event.clientY;
        startScrollLeft = scrollEl.scrollLeft;

        isDragging = false;
        isBlockingClicks = false;
    }

    function handlePointerMove(event: PointerEvent) {
        if (event.pointerId !== activePointerId) {
            return;
        }

        const distanceX = event.clientX - startX;
        const distanceY = event.clientY - startY;

        const absoluteX = Math.abs(distanceX);
        const absoluteY = Math.abs(distanceY);

        if (!gestureDirection) {
            const hasPassedThreshold =
                absoluteX > DIRECTION_THRESHOLD ||
                absoluteY > DIRECTION_THRESHOLD;

            if (!hasPassedThreshold) {
                return;
            }

            gestureDirection =
                absoluteX > absoluteY
                    ? "horizontal"
                    : "vertical";

            if (gestureDirection === "vertical") {
                isDragging = false;
                return;
            }

            isDragging = true;
            isBlockingClicks = true;

            if (
                activePointerType === "mouse" &&
                !scrollEl.hasPointerCapture(event.pointerId)
            ) {
                scrollEl.setPointerCapture(event.pointerId);
            }
        }

        if (gestureDirection === "vertical") {
            return;
        }

        isDragging = true;
        isBlockingClicks = true;

        if (event.cancelable) {
            event.preventDefault();
        }

        event.stopPropagation();

        scrollEl.scrollLeft =
            startScrollLeft - distanceX;

        updateScrollFades();
    }

    function handlePointerEnd(event: PointerEvent) {
        if (event.pointerId !== activePointerId) {
            return;
        }

        if (scrollEl.hasPointerCapture(event.pointerId)) {
            scrollEl.releasePointerCapture(event.pointerId);
        }

        const shouldKeepBlockingClick =
            gestureDirection === "horizontal" &&
            isBlockingClicks;

        isDragging = false;

        activePointerId = null;
        activePointerType = null;
        gestureDirection = null;

        clearTimeout(clickBlockTimeout);

        if (shouldKeepBlockingClick) {
            clickBlockTimeout = setTimeout(() => {
                isBlockingClicks = false;
            }, 180);
        } else {
            isBlockingClicks = false;
        }

        updateScrollFades();
    }

    function handleFilterClick(
        event: MouseEvent,
        clearFilter: () => void,
    ) {
        event.preventDefault();
        event.stopPropagation();

        if (isBlockingClicks) {
            return;
        }

        clearFilter();
    }


    $: if ($moodFilter.length >= 1 || $tagFilter.length >= 1 || $artistFilter.length >= 1 || $beatTypeFilter.length >= 1) {
        fetchBeatsWithFilters()
    }

    onMount(() => {
        updateScrollFades();

        resizeObserver = new ResizeObserver(() => {
            updateScrollFades();
        });

        resizeObserver.observe(scrollEl);

        requestAnimationFrame(() => {
            updateScrollFades();
        });
    });

    afterUpdate(() => {
        requestAnimationFrame(() => {
            updateScrollFades();
        });
    });

    onDestroy(() => {
        clearTimeout(clickBlockTimeout);
        resizeObserver?.disconnect();
    });
</script>

<div
    class="beatFilters_wrapper"
    class:canScrollLeft
    class:canScrollRight
>
    <div
        bind:this={scrollEl}
        class="beatFilters_flex"
        class:isDragging
        class:isBlockingClicks
        on:scroll={updateScrollFades}
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
                <div class="beatFilter_iconContainer">
                    <div class="beatFilter_icon">
                        <CloseIcon height="16px" />
                    </div>
                </div>

                <p class="beatFilter_text">
                    {$moodFilter.join(", ")}
                </p>
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
                <div class="beatFilter_iconContainer">
                    <div class="beatFilter_icon">
                        <CloseIcon height="16px" />
                    </div>
                </div>

                <p class="beatFilter_text">
                    {$tagFilter.join(", ")}
                </p>
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
                <div class="beatFilter_iconContainer">
                    <div class="beatFilter_icon">
                        <CloseIcon height="16px" />
                    </div>
                </div>

                <p class="beatFilter_text">
                    {$artistFilter.join(", ")}
                </p>
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
                <div class="beatFilter_iconContainer">
                    <div class="beatFilter_icon">
                        <CloseIcon height="16px" />
                    </div>
                </div>

                <p class="beatFilter_text">
                    {$beatTypeFilter.join(", ")}
                </p>
            </button>
        {/if}

        {#if activeFilterCount >= 2}
            <button
                type="button"
                class="beatFilters_button beatFilters_lastButton"
                on:click={(event) =>
                    handleFilterClick(
                        event,
                        clearAllFilters,
                    )}
            >
                <div class="beatFilter_iconContainer">
                    <div class="beatFilter_icon">
                        <CloseIcon height="16px" />
                    </div>
                </div>

                <p class="beatFilter_text">
                    Clear All Filters
                </p>
            </button>
        {/if}
    </div>
</div>

