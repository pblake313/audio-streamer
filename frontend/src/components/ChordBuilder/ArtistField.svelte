<script lang="ts">
    import "./ArtistField.css";

    import { onDestroy, tick } from "svelte";
    import { artistKeyOf } from "../../helpers/ChordBuilder/progressionsApi";

    /*
        The "Inspired by (artist)" field in the MIDI library: a field showing the
        artist, which opens a searchable list of the artists you already have
        (each with how many songs you've saved under it).
        Typing filters the list; a name you don't have yet shows up as
        "+ Add … as a new artist" at the bottom.

        `value` is the artist name to save. A typed name matching an existing
        artist (same letters, any case or spacing) picks that artist instead,
        so there are no near-duplicates.

        Keyboard: arrows move, Enter picks, Escape closes. The list is fixed to
        the window (the library panel scrolls and would clip it), placed under
        the field, or above it when there's no room below.
    */
    export let value: string;
    export let artists: string[]; // the ones you already have
    export let counts: Record<string, number> = {}; // saved songs per artist key
    export let label = "Artist"; // the accessible name (the visible label sits outside)
    export let placeholder = "Choose an artist…";

    // existing artists A-Z, one per artist even if spelled differently
    $: options = (() => {
        const byKey = new Map<string, string>();
        for (const name of artists) {
            const key = artistKeyOf(name);
            if (key && !byKey.has(key)) byKey.set(key, name);
        }
        return [...byKey.values()].sort((a, b) => a.localeCompare(b));
    })();

    let open = false;
    let query = "";
    let active = 0;
    let field: HTMLButtonElement;
    let search: HTMLInputElement;
    let list: HTMLUListElement;
    const id = `af_${Math.random().toString(36).slice(2, 8)}`;

    $: filtered = query.trim()
        ? options.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()))
        : options;
    // "+ Add" only for a name you don't have (in any spelling)
    $: canAdd = !!query.trim() && !options.some((name) => artistKeyOf(name) === artistKeyOf(query));
    $: rowCount = filtered.length + (canAdd ? 1 : 0);
    $: if (active >= rowCount) active = Math.max(0, rowCount - 1);

    // how many songs you've saved under an artist; nothing for one you haven't used yet
    const songsLabel = (name: string) => {
        const n = counts[artistKeyOf(name)] ?? 0;
        return n ? `${n} song${n === 1 ? "" : "s"}` : "";
    };

    // ---------- placement (fixed to the window)

    let top = 0;
    let left = 0;
    let width = 0;
    let above = false;

    function place() {
        if (!field) return;
        const rect = field.getBoundingClientRect();
        const room = window.innerHeight - rect.bottom;
        above = room < 300 && rect.top > room;
        width = Math.max(rect.width, 260);
        left = Math.min(rect.left, window.innerWidth - width - 12);
        top = above ? rect.top - 6 : rect.bottom + 6;
    }

    async function openList() {
        query = "";
        active = Math.max(0, options.findIndex((name) => artistKeyOf(name) === artistKeyOf(value)));
        place();
        open = true;
        await tick();
        search?.focus();
        scrollActive();
    }

    function close(focusField = true) {
        open = false;
        if (focusField) field?.focus();
    }

    function choose(name: string) {
        // a typed name you already have becomes that artist's spelling
        value = options.find((known) => artistKeyOf(known) === artistKeyOf(name)) ?? name.trim();
        close();
    }

    function pickRow(index: number) {
        if (index < filtered.length) choose(filtered[index]);
        else if (canAdd) choose(query);
    }

    async function scrollActive() {
        await tick();
        list?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
    }

    function onSearchKeydown(event: KeyboardEvent) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!rowCount) return;
            active = (active + (event.key === "ArrowDown" ? 1 : -1) + rowCount) % rowCount;
            scrollActive();
        } else if (event.key === "Enter") {
            event.preventDefault(); // pick, don't submit the form
            if (rowCount) pickRow(active);
        } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation(); // close the list, not the whole library
            close();
        } else if (event.key === "Tab") {
            close(false);
        }
    }

    function onPointerdown(event: PointerEvent) {
        const target = event.target as Node;
        if (open && !field?.contains(target) && !list?.parentElement?.contains(target)) close(false);
    }

    function listen(on: boolean) {
        if (typeof document === "undefined") return;
        const method = on ? "addEventListener" : "removeEventListener";
        document[method]("pointerdown", onPointerdown as EventListener);
        window[method]("scroll", place, { capture: true, passive: true } as AddEventListenerOptions);
        window[method]("resize", place);
    }
    $: listen(open);
    onDestroy(() => listen(false));
</script>

<button
    type="button"
    class="af_field"
    class:af_fieldOpen={open}
    class:af_fieldEmpty={!value}
    bind:this={field}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label="{label}: {value || 'none chosen'}"
    on:click={() => (open ? close() : openList())}
>
    <span class="af_value">{value || placeholder}</span>
    <svg class="af_chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
</button>

<!-- keeps the form from saving without an artist -->
<input class="af_required" tabindex="-1" aria-hidden="true" value={value} required />

{#if open}
    <div
        class="af_panel"
        class:af_panelAbove={above}
        style:top="{top}px"
        style:left="{left}px"
        style:width="{width}px"
    >
        <div class="af_searchRow">
            <svg class="af_searchIcon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            <input
                class="af_search"
                bind:this={search}
                bind:value={query}
                placeholder={options.length ? "Search or add an artist" : "Type an artist's name"}
                maxlength="60"
                role="combobox"
                aria-expanded="true"
                aria-controls={id}
                aria-activedescendant={rowCount ? `${id}-${active}` : undefined}
                aria-autocomplete="list"
                aria-label="Search your artists"
                on:input={() => (active = 0)}
                on:keydown={onSearchKeydown}
            />
        </div>

        <ul class="af_list" id={id} role="listbox" aria-label={label} bind:this={list}>
            {#each filtered as name, i (name)}
                {@const isPicked = artistKeyOf(name) === artistKeyOf(value)}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li
                    id="{id}-{i}"
                    class="af_option"
                    class:af_optionActive={active === i}
                    role="option"
                    aria-selected={isPicked}
                    data-index={i}
                    on:pointermove={() => (active = i)}
                    on:click={() => choose(name)}
                >
                    <span class="af_optionText">
                        <span class="af_optionName">{name}</span>
                        {#if songsLabel(name)}
                            <span class="af_optionMeta">{songsLabel(name)}</span>
                        {/if}
                    </span>
                    {#if isPicked}
                        <svg class="af_check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                    {/if}
                </li>
            {/each}

            {#if canAdd}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li
                    id="{id}-{filtered.length}"
                    class="af_option af_add"
                    class:af_optionActive={active === filtered.length}
                    role="option"
                    aria-selected="false"
                    data-index={filtered.length}
                    on:pointermove={() => (active = filtered.length)}
                    on:click={() => choose(query)}
                >
                    <span class="af_addIcon" aria-hidden="true">+</span>
                    <span class="af_optionText">
                        <span class="af_optionName">Add “{query.trim()}”</span>
                        <span class="af_optionMeta">as a new artist</span>
                    </span>
                </li>
            {/if}

            {#if !rowCount}
                <li class="af_empty" role="presentation">Start typing to add your first artist</li>
            {/if}
        </ul>
    </div>
{/if}
