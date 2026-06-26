

<script lang="ts">
    import { onDestroy, onMount, tick } from "svelte";
    import FolderNext from "../../Icons/svg/FolderNext.svelte";
    import FormInputErrorText from "../../errors/FormInputErrorText.svelte";
    let Z_COUNTER = 1000;
    import "./ColorSelect.css";

    export let colorOptions: {
        color: string;
        colorName: string;
    }[] = [];

    export let label: string = `Enter 'label'`;
    export let id: string = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    export let selectedOption: string | null = null;
    export let inputError: string | null = null;
    export let showInputErrors: boolean = true;

    export let onSelect: ((option: string) => void) | undefined;

    let isOpen = false;
    let openUp = false;

    let keepOnTop = false;
    let zIndex = 0;

    let selectWrapperElement: HTMLElement | null = null;

    const CLOSE_MS = 240;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const labelId = `${id}-label`;
    const buttonId = `${id}-button`;
    const listId = `options-${id}`;

    $: selectedColorOption =
        colorOptions.find((c) => c.color === selectedOption) ?? null;

    function decideDirection() {
        if (!selectWrapperElement) return;

        const rect = selectWrapperElement.getBoundingClientRect();

        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;

        openUp = spaceAbove > spaceBelow + 20;
    }

    function close() {
        if (!isOpen) return;

        isOpen = false;

        if (closeTimer) clearTimeout(closeTimer);

        closeTimer = setTimeout(() => {
            keepOnTop = false;
            closeTimer = null;
        }, CLOSE_MS);
    }

    async function toggleOpen(event: MouseEvent) {
        event.stopPropagation();

        if (isOpen) {
            close();
            return;
        }

        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }

        zIndex = ++Z_COUNTER;
        keepOnTop = true;

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

    function selectOption(event: MouseEvent, option: string) {
        event.stopPropagation();

        selectedOption = option;
        onSelect?.(option);

        close();
    }

    function handleClickOutside(event: MouseEvent) {
        if (
            selectWrapperElement &&
            !selectWrapperElement.contains(event.target as Node)
        ) {
            close();
        }
    }

    function handleOtherSelectOpen(event: Event) {
        const otherId = (event as CustomEvent).detail?.id;

        if (otherId && otherId !== id) {
            close();
        }
    }

    function handleResizeOrScroll() {
        if (isOpen) {
            decideDirection();
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (!isOpen) return;

        if (event.key === "Escape" || event.key === "Tab") {
            close();
        }
    }

    onMount(() => {
        window.addEventListener("click", handleClickOutside);
        window.addEventListener("select:open", handleOtherSelectOpen as EventListener);
        window.addEventListener("resize", handleResizeOrScroll);
        window.addEventListener("scroll", handleResizeOrScroll, { passive: true });
        window.addEventListener("keydown", handleKeyDown);
    });

    onDestroy(() => {
        window.removeEventListener("click", handleClickOutside);
        window.removeEventListener("select:open", handleOtherSelectOpen as EventListener);
        window.removeEventListener("resize", handleResizeOrScroll);
        window.removeEventListener("scroll", handleResizeOrScroll);
        window.removeEventListener("keydown", handleKeyDown);

        if (closeTimer) {
            clearTimeout(closeTimer);
        }
    });
</script>

<div
    class="colorSelectContainer"
    class:colorSelectZTop={keepOnTop}
    style={keepOnTop ? `z-index: ${zIndex};` : ""}
>
    <p id={labelId} class="colorSelectLabel">{label}</p>

    <div class="colorSelectAnchor">
        <div
            class="colorSelectWrap"
            class:colorSelectOpen={isOpen}
            class:colorSelectOpenUp={openUp}
            class:colorSelectHasError={!!inputError}
            bind:this={selectWrapperElement}
        >
            <button
                id={buttonId}
                type="button"
                class="colorSelectButton"
                class:colorSelectHasSelection={!!selectedColorOption}
                on:click={toggleOpen}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-labelledby={labelId}
                aria-invalid={!!inputError}
            >
                {#if selectedColorOption}
                    <div class="colorSelectRow">
                        <span
                            class="colorSelectDot"
                            style={`background-color: #${selectedColorOption.color}`}
                        ></span>

                        <div class="colorSelectTextWrapper">
                            <span class="colorSelectText">
                                {selectedColorOption.colorName}
                            </span>
                        </div>
                    </div>
                {:else}
                    <span class="colorSelectPlaceholder">Select...</span>
                {/if}

                <div class="colorSelectArrowWrapper">
                    <div
                        class="colorSelectArrowContainer"
                        class:colorSelectArrowRotated={isOpen}
                    >
                        <FolderNext color={"#b3b3b3"} />
                    </div>
                </div>
            </button>

            <div
                id={listId}
                class="colorSelectOptions"
                class:colorSelectOptionsOpen={isOpen}
                class:colorSelectOptionsOpenUp={openUp}
                role="listbox"
                aria-labelledby={labelId}
            >
                {#each colorOptions as c}
                    <button
                        type="button"
                        role="option"
                        aria-selected={selectedOption === c.color}
                        class="colorSelectOptionButton"
                        class:colorSelectOptionPicked={selectedOption === c.color}
                        on:click={(event) => selectOption(event, c.color)}
                    >
                        <div class="colorSelectRow">
                            <span
                                class="colorSelectDot"
                                style={`background-color: #${c.color}`}
                            ></span>

                            <div class="colorSelectTextWrapper">
                                <p class="colorSelectOptionLabel">{c.colorName}</p>
                            </div>
                        </div>
                    </button>
                {/each}
            </div>
        </div>
    </div>
</div>

{#if showInputErrors && inputError}
    <div class="colorSelectError">
        <FormInputErrorText inputErrorText={inputError} />
    </div>
{/if}