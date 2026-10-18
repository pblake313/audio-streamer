<script lang="ts">
    import { onDestroy, onMount, tick } from "svelte";
    import { quintOut } from "svelte/easing";
    import FolderNext from "../../Icons/svg/FolderNext.svelte";
    import FormInputErrorText from "../../errors/FormInputErrorText.svelte";
    import "./ColorSelect.css";

    let Z_COUNTER = 1000;

    export let colorOptions: {
        color: string;
        colorName: string;
    }[] = [];

    export let label: string = `Enter 'label'`;
    export let id: string = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    export let selectedOption: string | null = null;
    export let inputError: string | null = null;
    export let showInputErrors: boolean = true;

    // null when the color is cleared
    export let onSelect: ((option: string | null) => void) | undefined;

    let isOpen = false;
    let openUp = false;
    let alignLeft = false;
    let zIndex = 0;

    let wrapperEl: HTMLElement | null = null;
    let hovered: { color: string; colorName: string } | null = null;

    const labelId = `${id}-label`;
    const buttonId = `${id}-button`;
    const panelId = `colors-${id}`;

    // hue / saturation / lightness of a hex color, used to sort swatches
    function toHsl(hex: string) {
        const n = parseInt(hex.replace("#", ""), 16);
        const r = ((n >> 16) & 255) / 255;
        const g = ((n >> 8) & 255) / 255;
        const b = (n & 255) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        const d = max - min;

        if (d === 0) return { h: 0, s: 0, l };

        const sat = d / (1 - Math.abs(2 * l - 1));
        let h =
            max === r ? ((g - b) / d) % 6
            : max === g ? (b - r) / d + 2
            : (r - g) / d + 4;

        h = (h * 60 + 360) % 360;

        return { h, s: sat, l };
    }

    // rainbow order (by hue), with grays/whites/blacks grouped at the end
    $: sortedOptions = [...colorOptions].sort((a, b) => {
        const ha = toHsl(a.color);
        const hb = toHsl(b.color);
        const aGray = ha.s < 0.12;
        const bGray = hb.s < 0.12;

        if (aGray !== bGray) return aGray ? 1 : -1;
        if (aGray) return hb.l - ha.l;

        return ha.h - hb.h || hb.l - ha.l;
    });

    $: selectedColorOption =
        colorOptions.find((c) => c.color === selectedOption) ?? null;

    // footer shows the hovered swatch, falling back to the selected one
    $: footerOption = hovered ?? selectedColorOption;

    function decideDirection() {
        if (!wrapperEl) return;

        const rect = wrapperEl.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;

        // the panel is roughly 420px tall
        openUp = spaceBelow < 430 && rect.top > spaceBelow;

        // the panel is ~318px wide and normally hangs off the right edge of
        // the trigger; if that would run off the left of the screen, align
        // it to the trigger's left edge instead
        alignLeft = rect.right - 318 < 8;
    }

    function close() {
        isOpen = false;
        hovered = null;
    }

    async function toggleOpen(event: MouseEvent) {
        event.stopPropagation();

        if (isOpen) {
            close();
            return;
        }

        zIndex = ++Z_COUNTER;

        // close any other open selects
        window.dispatchEvent(
            new CustomEvent("select:open", {
                detail: { id },
            }),
        );

        decideDirection();
        isOpen = true;

        await tick();
        decideDirection();
    }

    function choose(event: MouseEvent, color: string | null) {
        event.stopPropagation();

        selectedOption = color;
        onSelect?.(color);

        close();
    }

    function handleClickOutside(event: MouseEvent) {
        if (wrapperEl && !wrapperEl.contains(event.target as Node)) {
            close();
        }
    }

    function handleOtherSelectOpen(event: Event) {
        const otherId = (event as CustomEvent).detail?.id;

        if (otherId && otherId !== id) {
            close();
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (isOpen && event.key === "Escape") {
            close();
        }
    }

    function pop(node: HTMLElement) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return { duration: 0 };
        }

        return {
            duration: 180,
            easing: quintOut,
            css: (t: number, u: number) => `
                opacity: ${t};
                transform: translateY(${u * (openUp ? 4 : -4)}px) scale(${0.98 + 0.02 * t});
            `,
        };
    }

    onMount(() => {
        window.addEventListener("click", handleClickOutside);
        window.addEventListener("select:open", handleOtherSelectOpen as EventListener);
        window.addEventListener("keydown", handleKeyDown);
    });

    onDestroy(() => {
        window.removeEventListener("click", handleClickOutside);
        window.removeEventListener("select:open", handleOtherSelectOpen as EventListener);
        window.removeEventListener("keydown", handleKeyDown);
    });
</script>

<div
    class="colorSelectContainer"
    style={isOpen ? `z-index: ${zIndex};` : ""}
    bind:this={wrapperEl}
>
    <p id={labelId} class="colorSelectLabel">{label}</p>

    <button
        id={buttonId}
        type="button"
        class="colorSelectButton"
        class:colorSelectOpen={isOpen}
        class:colorSelectHasError={!!inputError}
        on:click={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-labelledby={labelId}
    >
        {#if selectedColorOption}
            <span
                class="colorSelectSwatch"
                style={`background-color: #${selectedColorOption.color}`}
            ></span>
            <span class="colorSelectText">{selectedColorOption.colorName}</span>
        {:else}
            <span class="colorSelectSwatch colorSelectSwatchEmpty"></span>
            <span class="colorSelectPlaceholder">No color</span>
        {/if}

        <span class="colorSelectArrow" class:colorSelectArrowRotated={isOpen}>
            <FolderNext color={"#b3b3b3"} />
        </span>
    </button>

    {#if isOpen}
        <div
            id={panelId}
            class="colorSelectPanel"
            class:colorSelectPanelUp={openUp}
            class:colorSelectPanelLeft={alignLeft}
            role="dialog"
            aria-labelledby={labelId}
            transition:pop
        >
            <!-- hovered clears only when leaving the whole grid, not the gaps -->
            <div
                class="colorSelectGrid"
                role="listbox"
                aria-labelledby={labelId}
                on:mouseleave={() => (hovered = null)}
            >
                {#each sortedOptions as c}
                    <button
                        type="button"
                        role="option"
                        aria-selected={selectedOption === c.color}
                        aria-label={c.colorName}
                        title={c.colorName}
                        class="colorSelectOption"
                        class:colorSelectOptionPicked={selectedOption === c.color}
                        style={`--swatch: #${c.color}`}
                        on:mouseenter={() => (hovered = c)}
                        on:focus={() => (hovered = c)}
                        on:click={(event) => choose(event, c.color)}
                    ></button>
                {/each}
            </div>

            <div class="colorSelectFooter">
                <!-- swatch + name are always rendered, so the footer never changes size -->
                <div class="colorSelectFooterName">
                    <span
                        class="colorSelectSwatch"
                        class:colorSelectSwatchEmpty={!footerOption}
                        style={footerOption ? `background-color: #${footerOption.color}` : ""}
                    ></span>
                    <span class:colorSelectFooterHint={!footerOption}>
                        {footerOption ? footerOption.colorName : "Pick a color"}
                    </span>
                </div>

                {#if selectedOption}
                    <button
                        type="button"
                        class="colorSelectClear"
                        on:click={(event) => choose(event, null)}
                    >
                        Clear
                    </button>
                {/if}
            </div>
        </div>
    {/if}
</div>

{#if showInputErrors && inputError}
    <div class="colorSelectError">
        <FormInputErrorText inputErrorText={inputError} />
    </div>
{/if}
