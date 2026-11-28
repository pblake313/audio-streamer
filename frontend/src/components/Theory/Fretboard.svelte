<script lang="ts">
    import "./Fretboard.css";

    import { tick } from "svelte";
    import type { ChordLooper } from "../../helpers/ChordBuilder/ChordLooper";
    import { dragScroll } from "../../helpers/dragScroll";
    import { cellId, FRETS, STRINGS, type NeckHighlight } from "../../helpers/Theory/guitar";
    import { pretty } from "../../helpers/Theory/keys";

    /*
        A guitar neck in standard tuning with every note of the scale marked,
        drawn like tab (high e on top). The tonic is filled in the key's color.
        Tapping a note plays it. Sits inside KeyDetails, so it picks up --h.

        `highlight` (e.g. one pentatonic position) shades its frets and dims
        every note outside it; the neck scrolls to it when it's off screen.
    */
    // `label` (e.g. "♭5") shows in degree mode when given; `altered` notes are drawn dashed
    export let scale: { pc: number; name: string; degree: number; label?: string; altered?: boolean }[];
    export let looper: ChordLooper | null;
    export let labels: "notes" | "degrees" = "notes";
    export let highlight: NeckHighlight | null = null;

    const INLAYS = [3, 5, 7, 9, 12, 15];
    const fretNumbers = Array.from({ length: FRETS + 1 }, (_, f) => f);

    $: byPc = new Map(scale.map((note) => [note.pc, note]));

    // the note just tapped lights up for a moment
    let lit: string | null = null;
    let litTimer: ReturnType<typeof setTimeout>;

    // bring the (first) highlighted box into view on a neck that swipes
    let scroller: HTMLDivElement;
    let firstBand: HTMLElement | null = null;
    $: highlight, revealBand();

    async function revealBand() {
        await tick();
        if (!highlight || !firstBand || !scroller) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const box = firstBand.getBoundingClientRect();
        const view = scroller.getBoundingClientRect();
        if (box.left >= view.left && box.right <= view.right) return; // already showing
        scroller.scrollTo({
            left: scroller.scrollLeft + box.left - view.left - (view.width - box.width) / 2,
            behavior: reduce ? "auto" : "smooth",
        });
    }

    function play(midi: number, id: string) {
        looper?.previewNote(midi);
        lit = id;
        clearTimeout(litTimer);
        litTimer = setTimeout(() => (lit = null), 350);
    }
</script>

<div class="fb_scroll" use:dragScroll bind:this={scroller}>
    <div class="fb_board" class:fb_boardFocus={!!highlight} role="group" aria-label="Guitar neck in standard tuning">
        <!-- the highlighted box's frets, shaded behind everything -->
        {#if highlight}
            {#each highlight.spans as [from, to], i}
                {#if i === 0}
                    <span class="fb_band" style:grid-column="{from + 2} / {to + 3}" bind:this={firstBand}></span>
                {:else}
                    <span class="fb_band" style:grid-column="{from + 2} / {to + 3}"></span>
                {/if}
            {/each}
        {/if}

        <!-- fret wires (the nut after the open column), then inlay dots -->
        {#each fretNumbers as f}
            <span class="fb_fret" class:fb_nut={f === 0} style:grid-column={f + 2}></span>
        {/each}
        {#each INLAYS as f}
            <span class="fb_inlay" class:fb_inlayDouble={f === 12} style:grid-column={f + 2}>
                <span></span>
                {#if f === 12}<span></span>{/if}
            </span>
        {/each}

        {#each STRINGS as string, s}
            <!-- the string itself, thicker toward the low E -->
            <span class="fb_string" style:grid-row={s + 1} style="--thick: {1 + s * 0.4}px"></span>
            <span class="fb_label" style:grid-row={s + 1}>{string.name}</span>

            {#each fretNumbers as f}
                {@const midi = string.midi + f}
                {@const note = byPc.get(midi % 12)}
                {#if note}
                    {@const id = cellId(s, f)}
                    <button
                        type="button"
                        class="fb_note"
                        class:fb_tonic={note.degree === 1 && !note.altered}
                        class:fb_altered={!!note.altered}
                        class:fb_open={f === 0}
                        class:fb_lit={lit === id}
                        class:fb_out={!!highlight && !highlight.cells.has(id)}
                        style:grid-row={s + 1}
                        style:grid-column={f + 2}
                        aria-label={`Play ${pretty(note.name)}, ${string.name} string, ${f === 0 ? "open" : `fret ${f}`}`}
                        on:click={() => play(midi, id)}
                    >
                        <span class="fb_noteText">{labels === "notes" ? pretty(note.name) : (note.label ?? note.degree)}</span>
                    </button>
                {/if}
            {/each}
        {/each}

        <!-- fret numbers along the bottom -->
        {#each fretNumbers as f}
            <span class="fb_num" class:fb_numInlay={INLAYS.includes(f)} style:grid-column={f + 2}
                >{f === 0 ? "Open" : f}</span
            >
        {/each}
    </div>
</div>
