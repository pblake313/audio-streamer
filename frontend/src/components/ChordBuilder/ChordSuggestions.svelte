<script lang="ts">
    import "./ChordSuggestions.css";

    import { onMount } from "svelte";
    import { SCALES, chordName, type Root, type ScaleId } from "../../helpers/ChordBuilder/chords";
    import {
        VIBES,
        chordRole,
        suggestChords,
        type SimpleChord,
        type Suggestion,
        type SuggestionGroup,
    } from "../../helpers/ChordBuilder/suggestions";
    import { tensionColor } from "../../helpers/ChordBuilder/tension";

    export let current: SimpleChord;
    export let currentLabel: string; // may differ from root+quality for hand-edited notes
    export let prev: SimpleChord | null;
    export let next: SimpleChord | null;
    export let keyRoot: Root;
    export let scale: ScaleId;
    export let canRevert = false;
    export let revertLabel = "";

    export let onApply: (chord: SimpleChord) => void;
    export let onRevert: () => void;
    export let onClose: () => void; // × and Esc: back to the small picker
    export let onDone: () => void = onClose; // "Done" or clicking outside: finished with this chord

    const GROUPS: { id: SuggestionGroup; title: (next: string) => string; hint: string }[] = [
        { id: "color", title: () => "More color", hint: "Same chord, richer flavor" },
        { id: "sevenths", title: () => "7ths & 9ths in the key", hint: "The everyday chords of R&B, jazz and neo-soul" },
        { id: "dominants", title: () => "Dominants", hint: "Chords with a built-in pull: each one wants to resolve somewhere" },
        { id: "pull", title: (n) => `Pull into ${n}`, hint: "Chords that lead into what comes next" },
        { id: "swap", title: () => "Swap it", hint: "A different chord from the key doing the same job" },
        { id: "borrowed", title: () => "Borrowed & bold", hint: "From outside the key, for a bigger mood shift" },
    ];

    // suggestions are worked out for the chord as it was when the modal opened,
    // so applying one doesn't reshuffle the list under the cursor
    const anchor = current;
    $: ideas = suggestChords({ current: anchor, prev, next, keyRoot, scale });
    $: grouped = GROUPS.map((g) => ({ ...g, items: ideas.filter((s) => s.group === g.id) })).filter(
        (g) => g.items.length,
    );

    const isCurrent = (s: Suggestion, c: SimpleChord) => s.root === c.root && s.quality === c.quality;

    const tensionWord = (v: number) => (v < 0.3 ? "smooth" : v < 0.5 ? "moderate" : v < 0.7 ? "strong" : "very tense");

    // render at the end of <body> so no scrolling/clipping parent can cut it off
    function portal(node: HTMLElement) {
        document.body.appendChild(node);
        return { destroy: () => node.remove() };
    }

    let dialog: HTMLDivElement;

    onMount(() => {
        dialog?.focus();
        // keep the page behind from scrolling while the modal is open
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => (document.body.style.overflow = previous);
    });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="cbs_backdrop" use:portal on:click|self={onDone}>
    <div
        class="cbs_panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Chord ideas for ${currentLabel}`}
        tabindex="-1"
        bind:this={dialog}
    >
        <header class="cbs_header">
            <div>
                <p class="cbs_eyebrow">Chord ideas</p>
                <h4 class="cbs_title">{currentLabel}</h4>
                <p class="cbs_meta">
                    {chordRole(current, keyRoot, scale)} · {VIBES[current.quality]}
                </p>
                {#if prev || next}
                    <p class="cbs_context">
                        {#if prev}after <strong>{chordName(prev)}</strong>{/if}
                        {#if prev && next} · {/if}
                        {#if next}before <strong>{chordName(next)}</strong>{/if}
                    </p>
                {/if}
            </div>
            <button type="button" class="cbs_close" aria-label="Close chord ideas" on:click={onClose}>×</button>
        </header>

        <!-- groups sit side by side as columns, so most of it fits without scrolling -->
        <div class="cbs_body">
            {#each grouped as group (group.id)}
                <section class="cbs_group" class:cbs_groupWide={group.id === "sevenths" || group.id === "dominants"}>
                    <h6 class="cbs_groupTitle">{group.title(next ? chordName(next) : "")}</h6>
                    <p class="cbs_groupHint">{group.hint}</p>

                    <div class="cbs_items">
                        {#each group.items as s (s.name)}
                            <button
                                type="button"
                                class="cbs_item"
                                class:cbs_itemOn={isCurrent(s, current)}
                                title={`Use ${s.name}`}
                                on:click={() => onApply(s)}
                            >
                                <span class="cbs_itemTop">
                                    <span class="cbs_name">{s.name}</span>
                                    <span class="cbs_role">{s.role}</span>

                                    <!-- tension into and out of this choice -->
                                    <span class="cbs_tension" aria-hidden="true">
                                        {#if s.tensionIn !== null}
                                            <span
                                                class="cbs_dot"
                                                style="--tension: {tensionColor(s.tensionIn)}"
                                                title={`Into it: ${tensionWord(s.tensionIn)}`}
                                            ></span>
                                        {/if}
                                        {#if s.tensionOut !== null}
                                            <span
                                                class="cbs_dot"
                                                style="--tension: {tensionColor(s.tensionOut)}"
                                                title={`Into the next chord: ${tensionWord(s.tensionOut)}`}
                                            ></span>
                                        {/if}
                                    </span>
                                </span>

                                {#if s.outsideKey}
                                    {#if s.outsideKey.length === 0}
                                        <span class="cbs_keyTag cbs_keyTagIn">In key</span>
                                    {:else}
                                        <span
                                            class="cbs_keyTag cbs_keyTagOut"
                                            title="Notes from outside {keyRoot} {SCALES[scale].label}"
                                        >
                                            Borrowed: {s.outsideKey.join(", ")}
                                        </span>
                                    {/if}
                                {/if}

                                <span class="cbs_vibe">{s.vibe}</span>
                                <span class="cbs_reason">{s.reason}</span>
                            </button>
                        {/each}
                    </div>
                </section>
            {/each}
        </div>

        <footer class="cbs_footer">
            <span class="cbs_legend">
                <span class="cbs_dot" style="--tension: {tensionColor(0.2)}"></span>
                <span class="cbs_dot" style="--tension: {tensionColor(0.7)}"></span>
                tension in → out · click a chord to use it and hear it
            </span>
            <span class="cbs_footerActions">
                {#if canRevert}
                    <button type="button" class="cbs_button" on:click={onRevert}>Back to {revertLabel}</button>
                {/if}
                <button type="button" class="cbs_button cbs_buttonPrimary" on:click={onDone}>Done</button>
            </span>
        </footer>
    </div>
</div>
