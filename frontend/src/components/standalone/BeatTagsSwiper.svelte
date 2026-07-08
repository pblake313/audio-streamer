<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import type { Beat } from "../../lib/types/Beats";
    import BeatTag from "../misc/BeatTag.svelte";
    import "./BeatTagsSwiper.css";

    import {
        artistFilter,
        beatTypeFilter,
        moodFilter,
        tagFilter,
        toggleArtistFilter,
        toggleBeatTypeFilter,
        toggleMoodFilter,
        toggleTagFilter,
    } from "../../stores/AudioPlayer/BeatsStore";

    export let beat: Beat;

    export let tagPadding: string = "3px 6px 2px 6px";
    export let tagFontSize: string = "10pt";

    type TagType = "mood" | "tag" | "custom" | 'beatType';
    type GestureDirection = "horizontal" | "vertical" | null;

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

        /*
         * Do not capture the pointer here.
         *
         * Capturing immediately steals normal clicks from the BeatTag
         * buttons. The pointer will only be captured after a horizontal
         * drag has actually been detected.
         */
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

            /*
             * Leave vertical gestures completely alone so the page can
             * continue scrolling normally.
             */
            if (gestureDirection === "vertical") {
                isDragging = false;
                return;
            }

            isDragging = true;
            isBlockingClicks = true;

            /*
             * Only capture after we know this is a real horizontal mouse
             * drag. Normal button clicks never reach this point.
             */
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
            /*
             * Keep blocking briefly because browsers often fire a click
             * immediately after pointerup.
             */
            clickBlockTimeout = setTimeout(() => {
                isBlockingClicks = false;
            }, 180);
        } else {
            isBlockingClicks = false;
        }

        updateScrollFades();
    }

    function handleTagClick(
        event: MouseEvent,
        tag: string | null | undefined,
        tagType: TagType,
    ) {
        event.preventDefault();
        event.stopPropagation();

        if (isBlockingClicks || !tag) {
            return;
        }

        handleFilter(tag, tagType);
    }

    function handleFilter(
        tag: string,
        tagType: TagType,
    ) {
        if (tagType === "mood") {
            toggleMoodFilter(tag);
            return;
        }

        if (tagType === "tag") {
            toggleArtistFilter(tag);
            return;
        }

        if (tagType === 'beatType'){
            toggleBeatTypeFilter(tag)
            return
        }

        toggleTagFilter(tag);
    }

    onMount(() => {
        updateScrollFades();

        resizeObserver = new ResizeObserver(() => {
            updateScrollFades();
        });

        resizeObserver.observe(scrollEl);

        for (const child of Array.from(scrollEl.children)) {
            resizeObserver.observe(child);
        }

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
    class="bts_wrapper"
    class:canScrollLeft
    class:canScrollRight
>
    <div
        bind:this={scrollEl}
        class="bts_container"
        class:isDragging
        class:isBlockingClicks
        on:scroll={updateScrollFades}
        on:pointerdown={handlePointerDown}
        on:pointermove={handlePointerMove}
        on:pointerup={handlePointerEnd}
        on:pointercancel={handlePointerEnd}
    >
        {#if beat.customTag}
            <BeatTag
                tagColor={`#${beat.customTagColor || "f7f7f7"}`}
                tagText={beat.customTag}
                tagTextColor="#222222"
                on:click={(event) =>
                    handleTagClick(
                        event,
                        beat.customTag,
                        "custom",
                    )}
                isActive={$tagFilter.includes(
                    beat.customTag,
                )}
                padding={tagPadding}
                fontSize={tagFontSize}
            />
        {/if}

        {#if beat.tagOne}
            <BeatTag
                tagText={beat.tagOne}
                on:click={(event) =>
                    handleTagClick(
                        event,
                        beat.tagOne,
                        "tag",
                    )}
                isActive={$artistFilter.includes(
                    beat.tagOne,
                )}
                padding={tagPadding}
                fontSize={tagFontSize}
            />
        {/if}

        {#if beat.tagTwo}
            <BeatTag
                tagText={beat.tagTwo}
                on:click={(event) =>
                    handleTagClick(
                        event,
                        beat.tagTwo,
                        "tag",
                    )}
                isActive={$artistFilter.includes(
                    beat.tagTwo,
                )}
                padding={tagPadding}
                fontSize={tagFontSize}
            />
        {/if}

        {#if beat.mood}
            <BeatTag
                tagText={beat.mood}
                on:click={(event) =>
                    handleTagClick(
                        event,
                        beat.mood,
                        "mood",
                    )}
                isActive={$moodFilter.includes(
                    beat.mood,
                )}
                padding={tagPadding}
                fontSize={tagFontSize}
            />
        {/if}

        {#if beat.trackType === "Reference"}
            <BeatTag
                tagColor="#4abdff"
                tagText="Reference"
                tagTextColor="#222222"
                padding={tagPadding}
                fontSize={tagFontSize}
                isActive={$beatTypeFilter.includes(beat.trackType)}
                on:click={(event) => {
                    handleTagClick(
                        event,
                        beat.trackType,
                        'beatType'
                    )
                }}
            />
        {/if}
    </div>
</div>