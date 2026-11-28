<script lang="ts">
    // same dots as the swipeable card rows (Features, Summary), so every
    // slider on the site shows its position the same way. Swiping or tapping
    // a dot changes slides; there are no arrow buttons.
    import "../UI/SwipeDots.css";
    import "./SwiperControls.css";

    export let current = 0;
    export let total = 0;
    export let label = "screenshots";
    export let onGoTo: (index: number) => void = () => {};
</script>

<div class="swipeDots sc_dots" role="tablist" aria-label={`${label} position`}>
    {#each Array(total) as _, i}
        <button
            type="button"
            role="tab"
            class="swipeDot"
            class:swipeDotOn={current === i}
            aria-selected={current === i}
            aria-label={`Go to ${i + 1} of ${total}`}
            on:click={() => onGoTo(i)}
        ></button>
    {/each}
</div>
