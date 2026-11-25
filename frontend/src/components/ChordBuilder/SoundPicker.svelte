<script lang="ts">
    import "./Dropdown.css";
    import "./SoundPicker.css";

    import { tick } from "svelte";
    import {
        INSTRUMENTS,
        INSTRUMENT_GROUPS,
        INSTRUMENT_IDS,
        type InstrumentGroup,
        type InstrumentId,
    } from "../../helpers/ChordBuilder/instruments";

    export let value: InstrumentId;
    export let onChange: (id: InstrumentId) => void;

    const soundsIn = (group: InstrumentGroup) => INSTRUMENT_IDS.filter((id) => INSTRUMENTS[id].group === group);

    let open = false;
    let category: InstrumentGroup = INSTRUMENTS[value].group; // column shown on the right
    let active: InstrumentId = value; // highlighted sound (mouse or keyboard)
    let root: HTMLDivElement;
    let trigger: HTMLButtonElement;
    let soundList: HTMLUListElement;

    $: sounds = soundsIn(category);

    async function openPicker() {
        category = INSTRUMENTS[value].group; // start where the current sound lives
        active = value;
        open = true;
        await tick();
        scrollToActive();
    }

    function close(refocus = false) {
        open = false;
        if (refocus) trigger?.focus();
    }

    function choose(id: InstrumentId) {
        if (id !== value) onChange(id);
        close(true);
    }

    function showCategory(group: InstrumentGroup) {
        if (group === category) return;
        category = group;
        active = soundsIn(group).includes(value) ? value : soundsIn(group)[0];
    }

    function scrollToActive() {
        soundList?.querySelector<HTMLElement>(`[data-id="${active}"]`)?.scrollIntoView({ block: "nearest" });
    }

    function handleKeydown(event: KeyboardEvent) {
        if (!open) {
            if (["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
                event.preventDefault();
                openPicker();
            }
            return;
        }

        const i = sounds.indexOf(active);
        const g = INSTRUMENT_GROUPS.indexOf(category);

        if (event.key === "ArrowDown") active = sounds[Math.min(sounds.length - 1, i + 1)];
        else if (event.key === "ArrowUp") active = sounds[Math.max(0, i - 1)];
        else if (event.key === "ArrowRight") showCategory(INSTRUMENT_GROUPS[(g + 1) % INSTRUMENT_GROUPS.length]);
        else if (event.key === "ArrowLeft")
            showCategory(INSTRUMENT_GROUPS[(g - 1 + INSTRUMENT_GROUPS.length) % INSTRUMENT_GROUPS.length]);
        else if (event.key === "Enter") choose(active);
        else if (event.key === "Escape") close(true);
        else if (event.key === "Tab") return close();
        else return;

        event.preventDefault();
        event.stopPropagation();
        tick().then(scrollToActive);
    }

    function handleWindowPointerDown(event: PointerEvent) {
        if (open && !root.contains(event.target as Node)) close();
    }
</script>

<svelte:window on:pointerdown={handleWindowPointerDown} />

<div class="dd_root" bind:this={root}>
    <button
        type="button"
        class="dd_trigger dd_withIcon"
        class:dd_triggerOpen={open}
        style="min-width: 180px"
        aria-label={`Sound: ${INSTRUMENTS[value].label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        bind:this={trigger}
        on:click={() => (open ? close() : openPicker())}
        on:keydown={handleKeydown}
    >
        <svg class="dd_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 5L6 9H3v6h3l5 4V5z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
        <span class="dd_value">
            {INSTRUMENTS[value].label}
            <small class="sp_triggerGroup">{INSTRUMENTS[value].group}</small>
        </span>
        <svg class="dd_chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
        </svg>
    </button>

    {#if open}
        <div class="sp_panel" role="dialog" aria-label="Choose a sound">
            <!-- left: categories -->
            <ul class="sp_categories" role="tablist" aria-label="Sound categories">
                {#each INSTRUMENT_GROUPS as group (group)}
                    <li role="presentation">
                        <button
                            type="button"
                            role="tab"
                            class="sp_category"
                            class:sp_categoryOn={group === category}
                            class:sp_categoryHasCurrent={INSTRUMENTS[value].group === group}
                            aria-selected={group === category}
                            tabindex="-1"
                            on:pointerenter={() => showCategory(group)}
                            on:click={() => showCategory(group)}
                        >
                            <span class="sp_categoryIcon" aria-hidden="true">
                                {#if group === "Pianos"}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M8 5v8M12 5v8M16 5v8" stroke-linecap="round" /><path d="M6.5 5h3v6h-3zM14.5 5h3v6h-3z" fill="currentColor" stroke="none" /></svg>
                                {:else if group === "Keys & Mallets"}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L14 6" /><circle cx="15.5" cy="4.8" r="2" fill="currentColor" stroke="none" /><path d="M10 20l8-8" /><circle cx="19.2" cy="10.8" r="2" fill="currentColor" stroke="none" /></svg>
                                {:else if group === "Pads"}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9.5a4.25 4.25 0 0 1-.5 8.5H7z" /></svg>
                                {:else}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0" /></svg>
                                {/if}
                            </span>
                            <span class="sp_categoryName">{group}</span>
                            <span class="sp_count">{soundsIn(group).length}</span>
                        </button>
                    </li>
                {/each}
            </ul>

            <!-- right: sounds in the shown category -->
            <ul class="sp_sounds" role="listbox" aria-label={`${category} sounds`} bind:this={soundList}>
                {#each sounds as id (id)}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <li
                        class="sp_sound"
                        class:sp_soundActive={id === active}
                        class:sp_soundSelected={id === value}
                        role="option"
                        aria-selected={id === value}
                        data-id={id}
                        on:pointerenter={() => (active = id)}
                        on:click={() => choose(id)}
                    >
                        <span class="sp_soundText">
                            <span class="sp_soundName">{INSTRUMENTS[id].label}</span>
                        </span>
                        {#if id === value}
                            <svg class="dd_check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M5 12.5l4.5 4.5L19 7.5" />
                            </svg>
                        {/if}
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</div>
