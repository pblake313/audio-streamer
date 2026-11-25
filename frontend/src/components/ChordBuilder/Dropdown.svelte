<script lang="ts">
    import "./Dropdown.css";

    import { tick } from "svelte";

    type Option = { value: string; label: string; group?: string };

    export let value: string;
    export let options: Option[];
    export let ariaLabel: string;
    export let onChange: (value: string) => void;
    export let icon: "sound" | null = null;
    export let minWidth: string | null = null;

    const id = `dd-${Math.random().toString(36).slice(2, 8)}`;

    let open = false;
    let openUp = false;
    let active = 0; // highlighted row (mouse or keyboard)
    let root: HTMLDivElement;
    let trigger: HTMLButtonElement;
    let list: HTMLUListElement;

    $: selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
    $: selected = options[selectedIndex];

    async function openList() {
        // open upward when there isn't room below
        const rect = trigger.getBoundingClientRect();
        openUp = window.innerHeight - rect.bottom < 280 && rect.top > window.innerHeight - rect.bottom;

        open = true;
        active = selectedIndex;
        await tick();
        scrollToActive();
    }

    function close(refocus = false) {
        open = false;
        if (refocus) trigger?.focus();
    }

    function choose(index: number) {
        const option = options[index];
        if (option && option.value !== value) onChange(option.value);
        close(true);
    }

    function scrollToActive() {
        list?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
    }

    function move(to: number) {
        active = Math.max(0, Math.min(options.length - 1, to));
        scrollToActive();
    }

    // type a letter to jump to the next option starting with it
    function typeahead(key: string) {
        const k = key.toLowerCase();
        for (let step = 1; step <= options.length; step++) {
            const i = (active + step) % options.length;
            if (options[i].label.toLowerCase().startsWith(k)) return move(i);
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (!open) {
            if (["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
                event.preventDefault();
                openList();
            }
            return;
        }

        if (event.key === "ArrowDown") move(active + 1);
        else if (event.key === "ArrowUp") move(active - 1);
        else if (event.key === "Home") move(0);
        else if (event.key === "End") move(options.length - 1);
        else if (event.key === "Enter") choose(active);
        else if (event.key === "Escape") close(true);
        else if (event.key === "Tab") return close();
        else if (event.key.length === 1 && /\S/.test(event.key)) typeahead(event.key);
        else return;

        event.preventDefault();
        event.stopPropagation(); // e.g. don't let Esc also close other panels
    }

    function handleWindowPointerDown(event: PointerEvent) {
        if (open && !root.contains(event.target as Node)) close();
    }
</script>

<svelte:window on:pointerdown={handleWindowPointerDown} />

<div class="dd_root" bind:this={root}>
    <button
        type="button"
        class="dd_trigger"
        class:dd_triggerOpen={open}
        class:dd_withIcon={icon !== null}
        style={minWidth ? `min-width: ${minWidth}` : ""}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        bind:this={trigger}
        on:click={() => (open ? close() : openList())}
        on:keydown={handleKeydown}
    >
        {#if icon === "sound"}
            <svg class="dd_icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 5L6 9H3v6h3l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
        {/if}
        <span class="dd_value">{selected?.label ?? ""}</span>
        <svg class="dd_chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
        </svg>
    </button>

    {#if open}
        <ul
            class="dd_list"
            class:dd_listUp={openUp}
            id={`${id}-list`}
            role="listbox"
            aria-label={ariaLabel}
            bind:this={list}
        >
            {#each options as option, i (option.value)}
                <!-- a heading whenever the group changes (e.g. Pianos / Pads) -->
                {#if option.group && option.group !== options[i - 1]?.group}
                    <li class="dd_group" role="presentation">{option.group}</li>
                {/if}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <li
                    class="dd_option"
                    class:dd_optionActive={i === active}
                    class:dd_optionSelected={option.value === value}
                    role="option"
                    aria-selected={option.value === value}
                    data-index={i}
                    on:pointerenter={() => (active = i)}
                    on:click={() => choose(i)}
                >
                    <span>{option.label}</span>
                    {#if option.value === value}
                        <svg class="dd_check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>
