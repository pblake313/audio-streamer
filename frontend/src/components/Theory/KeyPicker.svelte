<script lang="ts">
    import "./KeyPicker.css";

    import { onDestroy, tick } from "svelte";
    import CircleOfFifths from "./CircleOfFifths.svelte";
    import { keyHue, keyName, type KeyRef } from "../../helpers/Theory/keys";
    import { sameKey } from "../../helpers/Theory/urls";

    /*
        The key you're in, and a pop-up circle of fifths to switch to any other,
        pinned to the right of the theory page's sticky section bar so it's
        always in reach (the big circle scrolls away with the top of the page).

        Click a segment: that key, and the panel closes. Arrow keys work like
        on the big circle (round the circle / major <-> minor) and keep the
        panel open so you can watch the page change behind it. Escape, Tab or a
        click outside closes it, and focus goes back to the button.
    */
    export let key: KeyRef;
    export let onSelect: (key: KeyRef) => void;

    let open = false;
    let root: HTMLDivElement;
    let trigger: HTMLButtonElement;
    let panel: HTMLDivElement;
    const panelId = `kp_${Math.random().toString(36).slice(2, 8)}`;

    /*
        The panel is fixed to the window, placed from the button's spot on screen:
        the button can sit inside the bar's swipeable row, which would clip a
        panel hanging out of it. Right-aligned under the button, kept on screen.
    */
    const PANEL_W = 320;
    const MARGIN = 12;
    let panelTop = 0;
    let panelLeft = 0;

    function place() {
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const viewW = document.documentElement.clientWidth; // without the page scrollbar
        const width = Math.min(PANEL_W, viewW - MARGIN * 2);
        panelTop = rect.bottom + 10;
        panelLeft = Math.min(Math.max(rect.right - width, MARGIN), viewW - width - MARGIN);
    }

    async function openPanel() {
        place();
        open = true;
        await tick();
        // the circle itself takes the arrow keys
        panel?.querySelector<SVGElement>(".cof")?.focus({ preventScroll: true });
    }

    function close(focusTrigger = true) {
        open = false;
        if (focusTrigger) trigger?.focus();
    }

    function choose(next: KeyRef) {
        if (!sameKey(next, key)) onSelect(next);
    }

    // a click on a segment picks (the circle handles that) and then closes
    function onPanelClick(event: MouseEvent) {
        if ((event.target as Element).closest(".cof_segment")) close();
    }

    function onPanelKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.preventDefault();
            close();
        } else if (event.key === "Tab") {
            close(false);
        }
    }

    function onPointerdown(event: PointerEvent) {
        if (open && root && !root.contains(event.target as Node)) close(false);
    }

    function listen(on: boolean) {
        if (typeof document === "undefined") return;
        const method = on ? "addEventListener" : "removeEventListener";
        document[method]("pointerdown", onPointerdown as EventListener);
        // follow the button if the page or the bar's row scrolls, or the window resizes
        window[method]("scroll", place, { capture: true, passive: true } as AddEventListenerOptions);
        window[method]("resize", place);
    }
    $: listen(open);
    onDestroy(() => listen(false));
</script>

<div class="kp" bind:this={root} style="--kh: {keyHue(key.pos)}">
    <button
        type="button"
        class="kp_trigger"
        class:kp_triggerOpen={open}
        bind:this={trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Key: {keyName(key)}. Change key"
        on:click={() => (open ? close() : openPanel())}
    >
        <span class="kp_dot" aria-hidden="true"></span>
        <span class="kp_name">{keyName(key)}</span>
        <svg class="kp_chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>

    {#if open}
        <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
        <div
            class="kp_panel"
            style:top="{panelTop}px"
            style:left="{panelLeft}px"
            id={panelId}
            role="dialog"
            aria-label="Choose a key on the circle of fifths"
            bind:this={panel}
            on:click={onPanelClick}
            on:keydown={onPanelKeydown}
        >
            <CircleOfFifths selected={key} onSelect={choose} />
            <p class="kp_hint">Outer ring major, inner ring minor</p>
        </div>
    {/if}
</div>
