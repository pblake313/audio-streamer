<script lang="ts">
    import { onDestroy } from "svelte";
    import type { Beat } from "../../lib/types/Beats";
    import BeatTag from "../misc/BeatTag.svelte";
    import "./BeatTagsSwiper.css";
    import {  artistFilter, moodFilter, tagFilter, toggleArtistFilter, toggleMoodFilter, toggleTagFilter } from "../../stores/AudioPlayer/BeatsStore";

    export let beat: Beat;

    let scrollEl: HTMLDivElement;

    let isDragging = false;
    let isBlockingClicks = false;
    let startX = 0;
    let startScrollLeft = 0;
    let clickBlockTimeout: ReturnType<typeof setTimeout>;

    function handlePointerDown(event: PointerEvent) {
        event.stopPropagation();

        if (event.pointerType === "mouse" && event.button !== 0) return;

        isDragging = true;
        isBlockingClicks = false;

        startX = event.clientX;
        startScrollLeft = scrollEl.scrollLeft;
    }

    function handlePointerMove(event: PointerEvent) {
        if (!isDragging) return;

        event.stopPropagation();

        const distance = event.clientX - startX;

        if (Math.abs(distance) > 4) {
            isBlockingClicks = true;

            if (event.cancelable) {
                event.preventDefault();
            }
        }

        scrollEl.scrollLeft = startScrollLeft - distance;
    }

    function handlePointerUp(event: PointerEvent) {
        event.stopPropagation();

        isDragging = false;

        clearTimeout(clickBlockTimeout);

        clickBlockTimeout = setTimeout(() => {
            isBlockingClicks = false;
        }, 180);
    }

    function handleTagClick(event: MouseEvent, tag: string | null | undefined, tagType: 'mood' | 'tag' | 'custom') {
        event.preventDefault();
        event.stopPropagation();

        if (isBlockingClicks || !tag) return;

        handleFilter(tag, tagType);
    }

    function handleFilter(tag: string, tagType: 'mood' | 'tag' | 'custom') {

        if (tagType === 'mood'){
            toggleMoodFilter(tag)
        } else if (tagType === 'tag') {
            toggleArtistFilter(tag)
        } else if (tagType === 'custom'){
            toggleTagFilter(tag)
        }

    }

    onDestroy(() => {
        clearTimeout(clickBlockTimeout);
    });

</script>

<div
    bind:this={scrollEl}
    class="bts_container"
    class:isDragging
    class:isBlockingClicks
    on:pointerdown={handlePointerDown}
    on:pointermove={handlePointerMove}
    on:pointerup={handlePointerUp}
    on:pointercancel={handlePointerUp}
>
    {#if beat.customTag}
        <BeatTag
            tagColor={`#${beat.customTagColor || "f7f7f7"}`}
            tagText={beat.customTag}
            tagTextColor="#222222"
            on:click={(event) => handleTagClick(event, beat.customTag, 'custom')}
            isActive={$tagFilter.includes(beat.customTag)}
        />
    {/if}

    {#if beat.tagOne}
        <BeatTag
            tagText={beat.tagOne}
            on:click={(event) => handleTagClick(event, beat.tagOne, 'tag')}
            isActive={$artistFilter.includes(beat.tagOne)}
        />
    {/if}

    {#if beat.tagTwo}
        <BeatTag
            tagText={beat.tagTwo}
            on:click={(event) => handleTagClick(event, beat.tagTwo, 'tag')}
            isActive={$artistFilter.includes(beat.tagTwo)}

        />
    {/if}

    {#if beat.mood}
        <BeatTag
            tagText={beat.mood}
            on:click={(event) => handleTagClick(event, beat.mood, 'mood')}
            isActive={$moodFilter.includes(beat.mood)}

        />
    {/if}
</div>