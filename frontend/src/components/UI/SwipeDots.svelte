<script lang="ts">
    import { onDestroy } from "svelte";
    import "./SwipeDots.css";

    /*
        Dots for a row of cards that swipes sideways (the row itself is plain
        CSS: overflow-x + scroll-snap). They follow whichever card is centered
        and slide to a card on tap. They only show while the row is actually
        wider than the screen, so the parent's breakpoints decide everything.
    */
    export let track: HTMLElement | null = null; // the scrolling row; each child is a card
    export let labels: string[]; // one per card, e.g. "Show Vault"
    export let ariaLabel = "Cards";

    let active = 0;
    let overflowing = false;
    let raf = 0;
    let observed: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;

    $: attach(track);

    function attach(el: HTMLElement | null) {
        if (el === observed) return;
        detach();
        observed = el;
        if (!el) return;
        el.addEventListener("scroll", onScroll, { passive: true });
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(el);
        measure();
    }

    function detach() {
        observed?.removeEventListener("scroll", onScroll);
        resizeObserver?.disconnect();
        resizeObserver = null;
        observed = null;
    }

    function measure() {
        if (!observed) return;
        overflowing = observed.scrollWidth > observed.clientWidth + 1;
        onScroll();
    }

    const cards = () => (observed ? (Array.from(observed.children) as HTMLElement[]) : []);

    function onScroll() {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            if (!observed) return;
            const center = observed.scrollLeft + observed.clientWidth / 2;
            let best = 0;
            let bestDistance = Infinity;
            cards().forEach((card, i) => {
                const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = i;
                }
            });
            active = best;
        });
    }

    function goTo(index: number) {
        const card = cards()[index];
        if (!card || !observed) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        observed.scrollTo({
            left: card.offsetLeft - (observed.clientWidth - card.offsetWidth) / 2,
            behavior: reduce ? "auto" : "smooth",
        });
    }

    onDestroy(() => {
        detach();
        if (typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(raf);
    });
</script>

{#if overflowing}
    <div class="swipeDots" role="tablist" aria-label={ariaLabel}>
        {#each labels as label, i}
            <button
                type="button"
                role="tab"
                class="swipeDot"
                class:swipeDotOn={active === i}
                aria-selected={active === i}
                aria-label={label}
                on:click={() => goTo(i)}
            ></button>
        {/each}
    </div>
{/if}
