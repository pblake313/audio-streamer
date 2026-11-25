<script lang="ts">
    import "./ChordPicker.css";

    import { ROOTS, type Quality, type Root, type ScaleId } from "../../helpers/ChordBuilder/chords";
    import {
        VIBES,
        chordRole,
        keyRoots,
        naturalChordOn,
        pickerQualities,
        qualityLabel,
        romanNumeral,
        type SimpleChord,
    } from "../../helpers/ChordBuilder/suggestions";

    export let current: SimpleChord;
    export let currentLabel: string;
    export let keyRoot: Root;
    export let scale: ScaleId;
    export let canRevert = false;
    export let revertLabel = "";

    export let onApply: (chord: SimpleChord) => void;
    export let onRevert: () => void;
    export let onClose: () => void;
    export let onOpenSuggestions: () => void;

    // start with just the key's notes and in-key chord types; extras on request
    let showAllRoots = !keyRoots(keyRoot, scale).includes(current.root);
    let showMoreTypes = false;

    $: inKeyRoots = keyRoots(keyRoot, scale);
    $: roots = showAllRoots
        ? [...inKeyRoots, ...ROOTS.filter((r) => !inKeyRoots.includes(r))]
        : inKeyRoots;
    $: types = pickerQualities(current.root, keyRoot, scale);
    // a borrowed current type stays visible even with "More types" closed
    $: shownTypes = showMoreTypes
        ? [...types.natural, ...types.other]
        : [...types.natural, ...(types.natural.includes(current.quality) ? [] : [current.quality])];

    $: keyPc = ROOTS.indexOf(keyRoot);

    /** Picking a root gives the key's own chord on it (e.g. D -> Dm in C major). */
    function pickRoot(root: Root) {
        if (root === current.root) return;
        const natural = naturalChordOn(root, keyRoot, scale);
        onApply(natural ?? { root, quality: current.quality });
    }

    function pickType(quality: Quality) {
        if (quality === current.quality) return;
        onApply({ root: current.root, quality });
    }

    const numeralFor = (root: Root) => {
        const natural = naturalChordOn(root, keyRoot, scale);
        return natural ? romanNumeral(natural, keyPc) : "";
    };
</script>

<div class="cbp_panel" role="dialog" aria-label={`Edit ${currentLabel}`}>
    <header class="cbp_header">
        <div>
            <h5 class="cbp_title">{currentLabel}</h5>
            <p class="cbp_meta">{chordRole(current, keyRoot, scale)} · {VIBES[current.quality]}</p>
        </div>
        <button type="button" class="cbp_close" aria-label="Close" on:click={onClose}>×</button>
    </header>

    <!-- 1. root note -->
    <section class="cbp_section">
        <div class="cbp_sectionHead">
            <span class="cbp_label">Root</span>
            {#if scale !== "none"}
                <button type="button" class="cbp_link" on:click={() => (showAllRoots = !showAllRoots)}>
                    {showAllRoots ? "Key notes only" : "All 12"}
                </button>
            {/if}
        </div>
        <div class="cbp_roots">
            {#each roots as root (root)}
                <button
                    type="button"
                    class="cbp_root"
                    class:cbp_on={root === current.root}
                    class:cbp_outside={!inKeyRoots.includes(root)}
                    title={inKeyRoots.includes(root) ? `${root} (in key)` : `${root} (outside the key)`}
                    on:click={() => pickRoot(root)}
                >
                    <span>{root}</span>
                    {#if numeralFor(root)}<small>{numeralFor(root)}</small>{/if}
                </button>
            {/each}
        </div>
    </section>

    <!-- 2. chord type -->
    <section class="cbp_section">
        <div class="cbp_sectionHead">
            <span class="cbp_label">Type</span>
            {#if types.other.length}
                <button type="button" class="cbp_link" on:click={() => (showMoreTypes = !showMoreTypes)}>
                    {showMoreTypes ? "In-key types only" : `More types (${types.other.length})`}
                </button>
            {/if}
        </div>
        <div class="cbp_types">
            {#each shownTypes as quality (quality)}
                <button
                    type="button"
                    class="cbp_type"
                    class:cbp_on={quality === current.quality}
                    class:cbp_outside={!types.natural.includes(quality)}
                    title={`${current.root}${quality}: ${VIBES[quality]}${types.natural.includes(quality) ? "" : " (borrows notes from outside the key)"}`}
                    on:click={() => pickType(quality)}
                >
                    {qualityLabel(quality)}
                </button>
            {/each}
        </div>
    </section>

    <footer class="cbp_footer">
        <button type="button" class="cbp_suggest" on:click={onOpenSuggestions}>
            ✨ Suggestions
        </button>
        {#if canRevert}
            <button type="button" class="cbp_revert" on:click={onRevert}>Back to {revertLabel}</button>
        {/if}
    </footer>
</div>
