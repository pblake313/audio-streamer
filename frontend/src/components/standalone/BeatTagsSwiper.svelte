<script lang="ts">
    import {
        onDestroy,
        onMount,
        tick,
    } from "svelte";

    import type { Beat } from "../../lib/types/Beats";

    import BeatTag from "../misc/BeatTag.svelte";
    import "./BeatTagsSwiper.css";

    import {
        artistFilter,
        beatTypeFilter,
        isFetchingFilteredBeats,
        moodFilter,
        tagFilter,
        toggleArtistFilter,
        toggleBeatTypeFilter,
        toggleMoodFilter,
        toggleTagFilter,
    } from "../../stores/AudioPlayer/BeatsStore";

    export let beat: Beat;

    export let tagPadding = "3px 6px 2px 6px";
    export let tagFontSize = "10pt";

    type TagType =
        | "mood"
        | "tag"
        | "custom"
        | "beatType";

    let scrollEl: HTMLDivElement;
    let contentEl: HTMLDivElement;

    let canScrollLeft = false;
    let canScrollRight = false;

    /*
     * Mouse-only drag state.
     *
     * Touch input is intentionally left to the browser so Safari
     * can use native horizontal scrolling and momentum.
     */
    let mouseIsDown = false;
    let isDragging = false;
    let isBlockingClicks = false;

    let mouseStartX = 0;
    let mouseStartScrollLeft = 0;

    let clickBlockTimeout: number | null = null;
    let scrollAnimationFrame: number | null = null;

    let resizeObserver: ResizeObserver | null = null;

    const MOUSE_DRAG_THRESHOLD = 5;
    const SCROLL_EDGE_TOLERANCE = 2;
    const CLICK_BLOCK_DURATION = 140;

    function clearClickBlockTimeout() {
        if (clickBlockTimeout === null) {
            return;
        }

        window.clearTimeout(clickBlockTimeout);
        clickBlockTimeout = null;
    }

    function updateScrollFades() {
        if (!scrollEl) {
            return;
        }

        const maxScrollLeft = Math.max(
            0,
            scrollEl.scrollWidth -
                scrollEl.clientWidth,
        );

        canScrollLeft =
            scrollEl.scrollLeft >
            SCROLL_EDGE_TOLERANCE;

        canScrollRight =
            maxScrollLeft >
                SCROLL_EDGE_TOLERANCE &&
            scrollEl.scrollLeft <
                maxScrollLeft -
                    SCROLL_EDGE_TOLERANCE;
    }

    /*
     * Scroll events fire rapidly on touch devices.
     *
     * Throttle the reactive fade updates to one per animation
     * frame instead of updating Svelte state on every event.
     */
    function scheduleScrollFadeUpdate() {
        if (scrollAnimationFrame !== null) {
            return;
        }

        scrollAnimationFrame =
            window.requestAnimationFrame(() => {
                scrollAnimationFrame = null;
                updateScrollFades();
            });
    }

    function handleMouseDown(event: MouseEvent) {
        if (event.button !== 0) {
            return;
        }

        clearClickBlockTimeout();

        mouseIsDown = true;
        isDragging = false;
        isBlockingClicks = false;

        mouseStartX = event.clientX;
        mouseStartScrollLeft =
            scrollEl.scrollLeft;

        window.addEventListener(
            "mousemove",
            handleMouseMove,
            {
                passive: false,
            },
        );

        window.addEventListener(
            "mouseup",
            handleMouseUp,
            {
                once: true,
            },
        );
    }

    function handleMouseMove(event: MouseEvent) {
        if (!mouseIsDown) {
            return;
        }

        /*
         * Recover if mouseup occurred outside the browser window.
         */
        if ((event.buttons & 1) !== 1) {
            finishMouseDrag();
            return;
        }

        const distanceX =
            event.clientX - mouseStartX;

        if (
            !isDragging &&
            Math.abs(distanceX) <
                MOUSE_DRAG_THRESHOLD
        ) {
            return;
        }

        if (!isDragging) {
            isDragging = true;
            isBlockingClicks = true;
        }

        event.preventDefault();

        scrollEl.scrollLeft =
            mouseStartScrollLeft - distanceX;

        scheduleScrollFadeUpdate();
    }

    function handleMouseUp() {
        finishMouseDrag();
    }

    function finishMouseDrag() {
        const userDragged = isDragging;

        window.removeEventListener(
            "mousemove",
            handleMouseMove,
        );

        window.removeEventListener(
            "mouseup",
            handleMouseUp,
        );

        mouseIsDown = false;
        isDragging = false;

        clearClickBlockTimeout();

        if (userDragged) {
            /*
             * A click is commonly fired immediately after mouseup.
             * Keep blocking briefly to prevent accidental filters.
             */
            clickBlockTimeout = window.setTimeout(
                () => {
                    isBlockingClicks = false;
                    clickBlockTimeout = null;
                },
                CLICK_BLOCK_DURATION,
            );
        } else {
            isBlockingClicks = false;
        }

        scheduleScrollFadeUpdate();
    }

    function handleDragStart(event: DragEvent) {
        /*
         * Prevent images or text inside a BeatTag from starting
         * the browser's native desktop drag operation.
         */
        event.preventDefault();
    }

    function handleTagClick(
        event: Event,
        tag: string | null | undefined,
        tagType: TagType,
    ) {
        event.preventDefault();
        event.stopPropagation();

        if (
            isBlockingClicks ||
            !tag ||
            $isFetchingFilteredBeats
        ) {
            return;
        }

        handleFilter(tag, tagType);
    }

    function handleFilter(
        tag: string,
        tagType: TagType,
    ) {
        switch (tagType) {
            case "mood":
                toggleMoodFilter(tag);
                break;

            case "tag":
                toggleArtistFilter(tag);
                break;

            case "beatType":
                toggleBeatTypeFilter(tag);
                break;

            case "custom":
                toggleTagFilter(tag);
                break;
        }
    }

    onMount(async () => {
        await tick();

        updateScrollFades();

        /*
         * Observe the visible scroll container and one inner
         * content element instead of every individual BeatTag.
         */
        resizeObserver = new ResizeObserver(() => {
            scheduleScrollFadeUpdate();
        });

        resizeObserver.observe(scrollEl);
        resizeObserver.observe(contentEl);

        /*
         * Custom fonts can change the total content width after
         * the component initially renders.
         */
        document.fonts?.ready
            .then(() => {
                scheduleScrollFadeUpdate();
            })
            .catch(() => {
                // Font readiness is non-critical.
            });

        scheduleScrollFadeUpdate();
    });

    onDestroy(() => {
        window.removeEventListener(
            "mousemove",
            handleMouseMove,
        );

        window.removeEventListener(
            "mouseup",
            handleMouseUp,
        );

        clearClickBlockTimeout();

        resizeObserver?.disconnect();

        if (scrollAnimationFrame !== null) {
            window.cancelAnimationFrame(
                scrollAnimationFrame,
            );
        }
    });
</script>

<div
    class="bts_wrapper"
    class:canScrollLeft
    class:canScrollRight
>
    <div
        bind:this={scrollEl}
        class="bts_container"
        class:isDragging
        class:isBlockingClicks
        role="group"
        aria-label="Track filters"
        on:scroll|passive={scheduleScrollFadeUpdate}
        on:mousedown={handleMouseDown}
        on:dragstart={handleDragStart}
    >
        <div
            bind:this={contentEl}
            class="bts_content"
        >
            {#if beat.customTag}
                <BeatTag
                    tagColor={`#${beat.customTagColor || "f7f7f7"}`}
                    tagText={beat.customTag}
                    tagTextColor="#222222"
                    isActive={$tagFilter.includes(
                        beat.customTag,
                    )}
                    padding={tagPadding}
                    fontSize={tagFontSize}
                    isDisabled={$isFetchingFilteredBeats}
                    on:click={(event) =>
                        handleTagClick(
                            event,
                            beat.customTag,
                            "custom",
                        )}
                />
            {/if}

            {#if beat.tagOne}
                <BeatTag
                    tagText={beat.tagOne}
                    isActive={$artistFilter.includes(
                        beat.tagOne,
                    )}
                    padding={tagPadding}
                    fontSize={tagFontSize}
                    isDisabled={$isFetchingFilteredBeats}
                    on:click={(event) =>
                        handleTagClick(
                            event,
                            beat.tagOne,
                            "tag",
                        )}
                />
            {/if}

            {#if beat.tagTwo}
                <BeatTag
                    tagText={beat.tagTwo}
                    isActive={$artistFilter.includes(
                        beat.tagTwo,
                    )}
                    padding={tagPadding}
                    fontSize={tagFontSize}
                    isDisabled={$isFetchingFilteredBeats}
                    on:click={(event) =>
                        handleTagClick(
                            event,
                            beat.tagTwo,
                            "tag",
                        )}
                />
            {/if}

            {#if beat.mood}
                <BeatTag
                    tagText={beat.mood}
                    isActive={$moodFilter.includes(
                        beat.mood,
                    )}
                    padding={tagPadding}
                    fontSize={tagFontSize}
                    isDisabled={$isFetchingFilteredBeats}
                    on:click={(event) =>
                        handleTagClick(
                            event,
                            beat.mood,
                            "mood",
                        )}
                />
            {/if}

            {#if beat.trackType === "Reference"}
                <BeatTag
                    tagColor="#4abdff"
                    tagText="Reference"
                    tagTextColor="#222222"
                    isActive={$beatTypeFilter.includes(
                        beat.trackType,
                    )}
                    padding={tagPadding}
                    fontSize={tagFontSize}
                    isDisabled={$isFetchingFilteredBeats}
                    on:click={(event) =>
                        handleTagClick(
                            event,
                            beat.trackType,
                            "beatType",
                        )}
                />
            {/if}
        </div>
    </div>
</div>