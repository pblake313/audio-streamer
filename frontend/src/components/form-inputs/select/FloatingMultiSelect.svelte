<script lang="ts">
    import { tick } from "svelte";
    import { quintOut } from "svelte/easing";
    import "./FloatingMultiSelect.css";

    type Option = { value: string; label: string };

    export let options: Option[] = [];
    export let values: string[] = [];
    // text shown on the trigger (a summary of what's selected)
    export let label: string;
    export let ariaLabel: string;
    // "danger" tints the trigger red (e.g. when trash is included)
    export let tone: "default" | "danger" = "default";
    // values that can't be toggled right now (e.g. the last required one)
    export let lockedValues: string[] = [];
    export let onToggle: ((value: string) => void) | undefined = undefined;

    const id = `floatingMultiSelect-${Math.random().toString(36).slice(2, 9)}`;

    let isOpen = false;
    let activeIndex = 0;
    let triggerEl: HTMLButtonElement;
    let menuEl: HTMLDivElement;
    let menuTop = 0;
    let menuLeft = 0;

    // menu is position: fixed so the toolbar's overflow: hidden can't clip it
    function positionMenu() {
        if (!triggerEl) return;
        const rect = triggerEl.getBoundingClientRect();
        const menuWidth = menuEl?.offsetWidth ?? 0;
        menuTop = rect.bottom + 6;
        menuLeft = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));
    }

    async function open() {
        activeIndex = 0;
        isOpen = true;
        positionMenu();
        await tick();
        positionMenu();
        // don't let focusing the menu scroll the page (scrolling closes it)
        menuEl?.focus({ preventScroll: true });
    }

    function close(refocus = false) {
        isOpen = false;
        if (refocus) triggerEl?.focus();
    }

    function toggle(option: Option) {
        if (lockedValues.includes(option.value)) return;
        onToggle?.(option.value);
    }

    function handleTriggerKeydown(event: KeyboardEvent) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            open();
        }
    }

    function handleMenuKeydown(event: KeyboardEvent) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            activeIndex = (activeIndex + 1) % options.length;
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            activeIndex = (activeIndex - 1 + options.length) % options.length;
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle(options[activeIndex]);
        } else if (event.key === "Escape") {
            event.preventDefault();
            close(true);
        } else if (event.key === "Tab") {
            close();
        }
    }

    function handleWindowPointerDown(event: PointerEvent) {
        if (!isOpen) return;
        const target = event.target as Node;
        if (triggerEl?.contains(target) || menuEl?.contains(target)) return;
        close();
    }

    function handleViewportChange() {
        if (isOpen) positionMenu();
    }

    // scrolling the page (or anything outside the menu) closes it
    function handleScroll(event: Event) {
        if (!isOpen) return;
        if (event.target instanceof Node && menuEl?.contains(event.target)) return;
        close();
    }

    function pop(node: HTMLElement, { duration = 160 } = {}) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return { duration: 0 };
        }
        return {
            duration,
            easing: quintOut,
            css: (t: number, u: number) => `
                opacity: ${t};
                transform: translateY(${u * -4}px) scale(${0.97 + 0.03 * t});
            `,
        };
    }
</script>

<svelte:window
    on:pointerdown={handleWindowPointerDown}
    on:resize={handleViewportChange}
    on:scroll|capture={handleScroll}
/>

<div class="floatingMultiSelect">
    <button
        bind:this={triggerEl}
        type="button"
        class="floatingMultiSelect_trigger"
        class:floatingMultiSelect_trigger_open={isOpen}
        class:floatingMultiSelect_trigger_danger={tone === "danger"}
        aria-label="{ariaLabel}: {label}"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={id}
        on:click={() => (isOpen ? close() : open())}
        on:keydown={handleTriggerKeydown}
    >
        <span class="floatingMultiSelect_value">{label}</span>
        <svg class="floatingMultiSelect_chevron" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
    </button>

    {#if isOpen}
        <div
            bind:this={menuEl}
            {id}
            class="floatingMultiSelect_menu"
            role="listbox"
            aria-multiselectable="true"
            tabindex="-1"
            aria-label={ariaLabel}
            aria-activedescendant={`${id}-${activeIndex}`}
            style="top: {menuTop}px; left: {menuLeft}px;"
            transition:pop
            on:keydown={handleMenuKeydown}
        >
            {#each options as option, i}
                {@const isChecked = values.includes(option.value)}
                {@const isLocked = lockedValues.includes(option.value)}
                <!-- keyboard is handled on the listbox via aria-activedescendant -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                    id={`${id}-${i}`}
                    class="floatingMultiSelect_option"
                    class:floatingMultiSelect_option_active={i === activeIndex}
                    class:floatingMultiSelect_option_selected={isChecked}
                    class:floatingMultiSelect_option_locked={isLocked}
                    role="option"
                    aria-selected={isChecked}
                    aria-disabled={isLocked}
                    tabindex="-1"
                    on:pointerenter={() => (activeIndex = i)}
                    on:click={() => toggle(option)}
                >
                    <span
                        class="floatingMultiSelect_box"
                        class:floatingMultiSelect_box_checked={isChecked}
                        aria-hidden="true"
                    >
                        {#if isChecked}
                            <svg class="floatingMultiSelect_check" viewBox="0 0 12 12">
                                <path d="M2.5 6.2 5 8.5 9.5 3.5" />
                            </svg>
                        {/if}
                    </span>
                    <span>{option.label}</span>
                </div>
            {/each}
        </div>
    {/if}
</div>
