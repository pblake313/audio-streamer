<script lang="ts">
    import "./MidiLibrary.css";

    import { onMount } from "svelte";
    import { SCALES } from "../../helpers/ChordBuilder/chords";
    import { artistKeyOf, type SavedProgression } from "../../helpers/ChordBuilder/progressionsApi";
    import ArtistField from "./ArtistField.svelte";

    // the logged-in user's saved progressions (only rendered for logged-in users)
    export let saved: SavedProgression[];
    export let loading = false;
    export let artistNames: string[]; // the artists you already have (built-in styles + saved)
    // a just-imported file waiting to be saved (or not)
    export let pending: { fileName: string; chordCount: number; bpm: number; keyLabel: string } | null = null;

    export let onImportFile: (file: File) => void;
    export let onSavePending: (artist: string, song: string) => Promise<void>;
    export let onDiscardPending: () => void;
    export let onLoad: (progression: SavedProgression) => void;
    export let onEdit: (id: string, changes: { song: string; artist: string }) => Promise<void>;
    export let onDelete: (id: string) => Promise<void>;
    export let onClose: () => void;

    let fileInput: HTMLInputElement;
    let busy = false;

    // every artist you already have: the built-in styles and anyone you've saved under
    $: knownArtists = [...artistNames, ...saved.map((p) => p.artist)];

    // how many songs you've saved under each artist (by artist key), for the artist list
    $: artistCounts = saved.reduce<Record<string, number>>((counts, p) => {
        const key = artistKeyOf(p.artist);
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
    }, {});

    // a typed name that matches an existing artist saves under that artist's spelling
    const resolveArtist = (name: string) =>
        knownArtists.find((known) => artistKeyOf(known) === artistKeyOf(name)) ?? name.trim();

    // ---------- save form for a fresh import ----------

    let pendingArtist = "";
    let pendingSong = "";
    $: if (pending && !pendingSong) pendingSong = pending.fileName.replace(/\.midi?$/i, "");

    async function savePending() {
        if (busy || !pendingArtist.trim() || !pendingSong.trim()) return;
        busy = true;
        try {
            await onSavePending(resolveArtist(pendingArtist), pendingSong.trim());
            pendingArtist = "";
            pendingSong = "";
        } finally {
            busy = false;
        }
    }

    // ---------- editing a saved one ----------

    let editingId: string | null = null;
    let editSong = "";
    let editArtist = "";

    function startEdit(p: SavedProgression) {
        editingId = p.id;
        editSong = p.song;
        editArtist = p.artist;
    }

    async function saveEdit() {
        if (!editingId || busy || !editSong.trim() || !editArtist.trim()) return;
        busy = true;
        try {
            await onEdit(editingId, { song: editSong.trim(), artist: resolveArtist(editArtist) });
            editingId = null;
        } finally {
            busy = false;
        }
    }

    // two-step delete: the first click asks, the second deletes
    let confirmingDelete: string | null = null;

    async function remove(id: string) {
        if (confirmingDelete !== id) {
            confirmingDelete = id;
            return;
        }
        busy = true;
        try {
            await onDelete(id);
            confirmingDelete = null;
        } finally {
            busy = false;
        }
    }

    // grouped by artist, artists A-Z
    $: groups = [...new Set(saved.map((p) => p.artist))]
        .sort((a, b) => a.localeCompare(b))
        .map((artist) => ({ artist, items: saved.filter((p) => p.artist === artist) }));

    const describe = (p: SavedProgression) =>
        `${p.keyRoot} ${SCALES[p.scale]?.label ?? p.scale} · ${p.bpm} BPM · ${p.chords.length} chord${p.chords.length === 1 ? "" : "s"}`;

    // render at the end of <body> so no scrolling/clipping parent cuts it off
    function portal(node: HTMLElement) {
        document.body.appendChild(node);
        return { destroy: () => node.remove() };
    }

    onMount(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => (document.body.style.overflow = previous);
    });

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            if (editingId) editingId = null;
            else onClose();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="ml_backdrop" use:portal on:click|self={onClose}>
    <div class="ml_panel" role="dialog" aria-modal="true" aria-label="MIDI library">
        <header class="ml_header">
            <div>
                <p class="ml_eyebrow">Your MIDI library</p>
                <h4 class="ml_title">Saved progressions</h4>
                <p class="ml_hint">Saved progressions show up under their artist in Inspired by.</p>
            </div>
            <div class="ml_headerActions">
                <input
                    class="ml_fileInput"
                    type="file"
                    accept=".mid,.midi,audio/midi,audio/x-midi"
                    bind:this={fileInput}
                    on:change={(e) => {
                        const input = e.currentTarget;
                        const file = input.files?.[0];
                        input.value = "";
                        if (file) onImportFile(file);
                    }}
                />
                <button type="button" class="ml_button ml_buttonPrimary" on:click={() => fileInput.click()}>
                    Import MIDI
                </button>
                <button type="button" class="ml_close" aria-label="Close library" on:click={onClose}>×</button>
            </div>
        </header>

        <div class="ml_body">
            <!-- a fresh import: offer to save it -->
            {#if pending}
                <form class="ml_pending" on:submit|preventDefault={savePending}>
                    <p class="ml_pendingTitle">
                        Imported <strong>{pending.fileName}</strong>: {pending.chordCount} chords · {pending.bpm} BPM ·
                        key guessed as {pending.keyLabel}
                    </p>
                    <p class="ml_pendingHint">It's loaded in the timeline. Save it to your library to keep it:</p>
                    <div class="ml_fields">
                        <div class="ml_field">
                            <span aria-hidden="true">Inspired by (artist)</span>
                            <ArtistField bind:value={pendingArtist} artists={knownArtists} counts={artistCounts} label="Inspired by (artist)" />
                        </div>
                        <label class="ml_field">
                            <span>Song name</span>
                            <input bind:value={pendingSong} placeholder="e.g. Magnolia flip" maxlength="80" required />
                        </label>
                    </div>
                    <div class="ml_rowActions">
                        <button type="submit" class="ml_button ml_buttonPrimary" disabled={busy || !pendingArtist.trim() || !pendingSong.trim()}>
                            Save to library
                        </button>
                        <button type="button" class="ml_button" on:click={onDiscardPending}>Don't save</button>
                    </div>
                </form>
            {/if}

            {#if loading}
                <p class="ml_empty">Loading your progressions…</p>
            {:else if !groups.length}
                <p class="ml_empty">
                    Nothing saved yet. Import a MIDI file (or drag one onto the page) and save it under an artist.
                </p>
            {:else}
                {#each groups as group (group.artist)}
                    <section class="ml_group">
                        <h6 class="ml_groupTitle">{group.artist} <span>{group.items.length}</span></h6>

                        {#each group.items as p (p.id)}
                            <div class="ml_item">
                                {#if editingId === p.id}
                                    <form class="ml_edit" on:submit|preventDefault={saveEdit}>
                                        <div class="ml_fields">
                                            <label class="ml_field">
                                                <span>Song name</span>
                                                <input bind:value={editSong} maxlength="80" required />
                                            </label>
                                            <div class="ml_field">
                                                <span aria-hidden="true">Inspired by (artist)</span>
                                                <ArtistField bind:value={editArtist} artists={knownArtists} counts={artistCounts} label="Inspired by (artist)" />
                                            </div>
                                        </div>
                                        <div class="ml_rowActions">
                                            <button type="submit" class="ml_button ml_buttonPrimary" disabled={busy || !editSong.trim() || !editArtist.trim()}>Save</button>
                                            <button type="button" class="ml_button" on:click={() => (editingId = null)}>Cancel</button>
                                        </div>
                                    </form>
                                {:else}
                                    <div class="ml_itemText">
                                        <span class="ml_song">{p.song}</span>
                                        <span class="ml_meta">{describe(p)}{p.sourceFile ? ` · ${p.sourceFile}` : ""}</span>
                                    </div>
                                    <div class="ml_rowActions">
                                        <button type="button" class="ml_button" on:click={() => onLoad(p)}>Load</button>
                                        <button type="button" class="ml_button" on:click={() => startEdit(p)}>Edit</button>
                                        <button
                                            type="button"
                                            class="ml_button ml_buttonDanger"
                                            class:ml_confirm={confirmingDelete === p.id}
                                            disabled={busy}
                                            on:click={() => remove(p.id)}
                                            on:blur={() => confirmingDelete === p.id && (confirmingDelete = null)}
                                        >
                                            {confirmingDelete === p.id ? "Click to confirm" : "Delete"}
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </section>
                {/each}
            {/if}
        </div>
    </div>
</div>
