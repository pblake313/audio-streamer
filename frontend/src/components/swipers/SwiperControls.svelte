<script lang="ts">
    import RightArrowIcon from "../Icons/svg/RightArrowIcon.svelte";

    import "./SwiperControls.css";

    export let current = 0;
    export let total = 0;
    export let isBeginning = true;
    export let isEnd = false;
    export let showCount = true;
    export let label = "screenshots";

    export let onPrev: () => void = () => {};
    export let onNext: () => void = () => {};

    $: progress = total > 1 ? (current / (total - 1)) * 100 : 100;

    const pad = (n: number) => String(n).padStart(2, "0");
</script>

<div class="sc_controls" aria-label={`${label} navigation`}>
    <button
        type="button"
        class="sc_arrow sc_arrowPrev"
        on:click={onPrev}
        disabled={isBeginning}
        aria-label={`Previous ${label}`}
    >
        <RightArrowIcon height="14px" color="currentColor" />
    </button>

    {#if showCount}
        <span class="sc_count" aria-live="polite">
            <span class="sc_countCurrent">{pad(current + 1)}</span>
            <span class="sc_countDivider">/</span>
            <span>{pad(total)}</span>
        </span>
    {/if}

    <div class="sc_track" aria-hidden="true">
        <div class="sc_fill" style:width={`${progress}%`} />
    </div>

    <button
        type="button"
        class="sc_arrow"
        on:click={onNext}
        disabled={isEnd}
        aria-label={`Next ${label}`}
    >
        <RightArrowIcon height="14px" color="currentColor" />
    </button>
</div>
