<script lang="ts">
    import type { Beat } from "../../lib/types/Beats";
    import BeatTag from "../misc/BeatTag.svelte";
    import "./BeatTagsSwiper.css";

    export let beat: Beat;

    let scrollEl: HTMLDivElement;

    let isDragging = false;
    let isBlockingClicks = false;
    let startX = 0;
    let startScrollLeft = 0;
    let clickBlockTimeout: ReturnType<typeof setTimeout>;

    function handlePointerDown(event: PointerEvent) {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        isDragging = true;
        isBlockingClicks = false;

        startX = event.clientX;
        startScrollLeft = scrollEl.scrollLeft;

        scrollEl.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
        if (!isDragging) return;

        const distance = event.clientX - startX;

        if (Math.abs(distance) > 4) {
            isBlockingClicks = true;
        }

        scrollEl.scrollLeft = startScrollLeft - distance;
    }

    function handlePointerUp(event: PointerEvent) {
        isDragging = false;

        try {
            scrollEl.releasePointerCapture(event.pointerId);
        } catch {
            // pointer may already be released
        }

        clearTimeout(clickBlockTimeout);

        clickBlockTimeout = setTimeout(() => {
            isBlockingClicks = false;
        }, 120);
    }
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
        />
    {/if}

    {#if beat.tagOne}
        <BeatTag tagText={beat.tagOne} />
    {/if}

    {#if beat.tagTwo}
        <BeatTag tagText={beat.tagTwo} />
    {/if}

    {#if beat.mood}
        <BeatTag tagText={beat.mood} />
    {/if}
</div>