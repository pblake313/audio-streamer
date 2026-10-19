<script lang="ts">
    import { onMount, tick } from "svelte";
    import { fade } from "svelte/transition";

    import RightArrowIcon from "../Icons/svg/RightArrowIcon.svelte";

    import "./ScreenshotLightbox.css";

    export let images: string[] = [];
    export let index = 0;
    export let label = "Screenshot";
    export let onClose: (index: number) => void = () => {};

    let closeButton: HTMLButtonElement;
    let previouslyFocused: HTMLElement | null = null;

    const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 0 : 220;

    $: isFirst = index === 0;
    $: isLast = index === images.length - 1;

    const pad = (n: number) => String(n).padStart(2, "0");

    function prev() {
        if (!isFirst) index -= 1;
    }

    function next() {
        if (!isLast) index += 1;
    }

    function close() {
        onClose(index);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") close();
        else if (event.key === "ArrowLeft") prev();
        else if (event.key === "ArrowRight") next();
    }

    // render at the end of <body> so transformed ancestors can't break position: fixed
    function portal(node: HTMLElement) {
        document.body.appendChild(node);

        return {
            destroy() {
                node.remove();
            },
        };
    }

    // ---------------------------------------------
    // swipe left / right on touch screens
    // ---------------------------------------------
    const SWIPE_DISTANCE = 50;
    let swipeStartX: number | null = null;

    // a swipe that ends on the backdrop can still fire a click; don't close on it
    let justSwiped = false;

    function onPointerDown(event: PointerEvent) {
        if (event.pointerType === "mouse") return;
        swipeStartX = event.clientX;
        justSwiped = false;
    }

    function onPointerUp(event: PointerEvent) {
        if (swipeStartX === null) return;

        const dx = event.clientX - swipeStartX;
        swipeStartX = null;

        if (Math.abs(dx) < SWIPE_DISTANCE) return;

        justSwiped = true;
        if (dx < 0) next();
        else prev();
    }

    function onBackdropClick() {
        if (justSwiped) {
            justSwiped = false;
            return;
        }

        close();
    }

    onMount(() => {
        previouslyFocused = document.activeElement as HTMLElement | null;
        document.body.style.overflow = "hidden";

        tick().then(() => closeButton?.focus());

        return () => {
            document.body.style.overflow = "";
            previouslyFocused?.focus();
        };
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<div
    class="slb_overlay"
    use:portal
    role="dialog"
    aria-modal="true"
    aria-label={`${label} viewer`}
    transition:fade={{ duration }}
    on:pointerdown={onPointerDown}
    on:pointerup={onPointerUp}
    on:pointercancel={() => (swipeStartX = null)}
>
    <!-- clicking the dimmed area closes; the image itself does not -->
    <button
        type="button"
        class="slb_backdrop"
        tabindex="-1"
        aria-hidden="true"
        on:click={onBackdropClick}
    />

    <div class="slb_topBar">
        <span class="slb_count" aria-live="polite">
            <span class="slb_countCurrent">{pad(index + 1)}</span>
            <span class="slb_countDivider">/</span>
            <span>{pad(images.length)}</span>
        </span>

        <button
            type="button"
            class="slb_button slb_close"
            bind:this={closeButton}
            on:click={close}
            aria-label="Close viewer"
        >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                />
            </svg>
        </button>
    </div>

    <div class="slb_stage">
        {#key index}
            <img
                class="slb_image"
                src={images[index]}
                alt={`${label} ${index + 1} of ${images.length}`}
                draggable="false"
                in:fade={{ duration }}
            />
        {/key}
    </div>

    <button
        type="button"
        class="slb_button slb_nav slb_navPrev"
        on:click={prev}
        disabled={isFirst}
        aria-label={`Previous ${label.toLowerCase()}`}
    >
        <RightArrowIcon height="16px" color="currentColor" />
    </button>

    <button
        type="button"
        class="slb_button slb_nav slb_navNext"
        on:click={next}
        disabled={isLast}
        aria-label={`Next ${label.toLowerCase()}`}
    >
        <RightArrowIcon height="16px" color="currentColor" />
    </button>
</div>
