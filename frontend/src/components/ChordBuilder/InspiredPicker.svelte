<script lang="ts">
    import { floatPanel } from "../../helpers/ChordBuilder/floatPanel";
    import "./Dropdown.css";
    import "./SoundPicker.css";
    import "./InspiredPicker.css";

    import { tick } from "svelte";
    import { SCALES } from "../../helpers/ChordBuilder/chords";
    import type { ArtistStyle } from "../../helpers/ChordBuilder/artistStyles";

    // Two columns, like the sound picker: artists on the left, that artist's
    // songs (reference progressions + your saved MIDI) on the right.

    export let styles: ArtistStyle[];
    export let styleId: string; // "none" = nothing picked
    export let currentSong: string | null = null; // `${styleId}:${index}` of a loaded song
    export let width = "var(--cb-w-style, 150px)";

    export let onPickArtist: (id: string) => void; // generates a new progression in that style
    export let onPickSong: (id: string, index: number) => void; // loads that exact song
    export let onClear: () => void;

    let open = false;
    let shownId: string = styleId; // the artist shown on the right
    let root: HTMLDivElement;
    let trigger: HTMLButtonElement;

    $: current = styles.find((s) => s.id === styleId) ?? null;
    $: shown = styles.find((s) => s.id === shownId) ?? styles[0] ?? null;

    async function openPicker() {
        shownId = current?.id ?? styles[0]?.id ?? "none";
        open = true;
        await tick();
    }

    function close(refocus = false) {
        open = false;
        if (refocus) trigger?.focus();
    }

    function pickArtist(id: string) {
        onPickArtist(id);
        close(true);
    }

    function pickSong(id: string, index: number) {
        onPickSong(id, index);
        close(true);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (!open) {
            if (["ArrowDown", "Enter"].includes(event.key)) {
                event.preventDefault();
                openPicker();
            }
            return;
        }
        const i = styles.findIndex((s) => s.id === shownId);
        if (event.key === "ArrowDown") shownId = styles[Math.min(styles.length - 1, i + 1)].id;
        else if (event.key === "ArrowUp") shownId = styles[Math.max(0, i - 1)].id;
        else if (event.key === "Enter" && shown) pickArtist(shown.id);
        else if (event.key === "Escape") close(true);
        else if (event.key === "Tab") return close();
        else return;
        event.preventDefault();
        event.stopPropagation();
    }

    function handleWindowPointerDown(event: PointerEvent) {
        if (open && !root.contains(event.target as Node)) close();
    }

    const songMeta = (song: ArtistStyle["songs"][number]) =>
        `${song.key} ${SCALES[song.scale]?.label ?? song.scale} · ${song.bpm} BPM`;

    $: triggerTitle = current
        ? currentSong
            ? `${current.name}: ${current.songs[Number(currentSong.split(":")[1])]?.song ?? ""}`
            : `${current.name} (new progression in their style)`
        : "Pick an artist or one of their songs";
</script>

<svelte:window on:pointerdown={handleWindowPointerDown} />

<div class="dd_root" bind:this={root}>
    <button
        type="button"
        class="dd_trigger"
        class:dd_triggerOpen={open}
        style="width: {width}"
        aria-label="Inspired by"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={triggerTitle}
        bind:this={trigger}
        on:click={() => (open ? close() : openPicker())}
        on:keydown={handleKeydown}
    >
        {#if current}
            <span class="dd_value">{current.name}</span>
        {:else}
            <span class="dd_value dd_placeholder">Select artist</span>
        {/if}
        <!-- with an artist picked, the × (a sibling button) sits where the chevron was -->
        <svg class="dd_chevron" class:ip_chevronHidden={current} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
        </svg>
    </button>

    {#if current}
        <button
            type="button"
            class="ip_x"
            aria-label={`Clear ${current.name}`}
            title="Clear (no artist)"
            on:click={() => {
                onClear();
                close(true);
            }}
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
                <path d="M7 7l10 10M17 7L7 17" />
            </svg>
        </button>
    {/if}

    {#if open}
        <div class="sp_panel ip_panel" role="dialog" aria-label="Choose an artist or song" use:floatPanel={{ anchor: trigger, align: "left" }}>
            <!-- left: artists -->
            <ul class="sp_categories ip_artists" role="tablist" aria-label="Artists">
                <!-- first, so it's never scrolled out of view under a long artist list -->
                {#if styleId !== "none"}
                    <li role="presentation" class="ip_clearRow">
                        <button type="button" class="ip_clear" tabindex="-1" on:click={() => { onClear(); close(true); }}>
                            Clear (no artist)
                        </button>
                    </li>
                {/if}
                {#each styles as style (style.id)}
                    <li role="presentation">
                        <button
                            type="button"
                            role="tab"
                            class="sp_category"
                            class:sp_categoryOn={style.id === shown?.id}
                            class:sp_categoryHasCurrent={style.id === styleId}
                            aria-selected={style.id === shown?.id}
                            tabindex="-1"
                            on:pointerenter={() => (shownId = style.id)}
                            on:click={() => (shownId = style.id)}
                        >
                            <span class="sp_categoryName">{style.name}</span>
                            <span class="sp_count">{style.songs.length}</span>
                        </button>
                    </li>
                {/each}
            </ul>

            <!-- right: a new one in this style, then the artist's songs -->
            {#if shown}
                <ul class="sp_sounds" role="listbox" aria-label={`${shown.name} songs`}>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <li class="sp_sound ip_generate" role="option" aria-selected="false" on:click={() => pickArtist(shown.id)}>
                        <span class="sp_soundText">
                            <span class="sp_soundName">✨ New in this style</span>
                            <span class="ip_meta">A fresh progression built from {shown.name}'s chords</span>
                        </span>
                    </li>

                    {#each shown.songs as song, i (`${shown.id}:${i}`)}
                        {@const id = `${shown.id}:${i}`}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li
                            class="sp_sound"
                            class:sp_soundSelected={id === currentSong}
                            role="option"
                            aria-selected={id === currentSong}
                            on:click={() => pickSong(shown.id, i)}
                        >
                            <span class="sp_soundText">
                                <span class="sp_soundName">{song.song}</span>
                                <span class="ip_meta">
                                    {songMeta(song)}
                                    <span class="ip_tag" class:ip_tagSaved={!!song.savedId}>
                                        {song.savedId ? "Your MIDI" : "Reference"}
                                    </span>
                                </span>
                            </span>
                            {#if id === currentSong}
                                <svg class="dd_check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                                </svg>
                            {/if}
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
</div>
