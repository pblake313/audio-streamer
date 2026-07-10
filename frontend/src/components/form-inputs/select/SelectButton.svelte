
<script lang="ts">
    import { onDestroy, onMount, tick } from "svelte";
    import FolderNext from "../../Icons/svg/FolderNext.svelte";
    import FormInputErrorText from "../../errors/FormInputErrorText.svelte";
    import "./SelectButton.css";

    export let options: string[] = [];
    export let label: string = `Enter 'label'`;
    export let id: string = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    export let selectedOption: string | null = null;
    export let inputError: string | null = null;
    export let showInputErrors: boolean = true;

    let Z_COUNTER = 1000;


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
    const nativeId = `${id}-native`;

    function decideDirection() {
        if (!selectWrapperElement) return;

        const rect = selectWrapperElement.getBoundingClientRect();

        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;

        // Opens up when there is clearly more room above
        openUp = spaceAbove > spaceBelow + 20;
    }

    function close() {
        if (!isOpen) return;

        isOpen = false;

        // Keep z-index until close animation finishes
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

        // Close other SelectButton instances
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

    function handleNativeSelect(event: Event) {
        const target = event.currentTarget as HTMLSelectElement;
        const value = target.value;

        if (!value) {
            selectedOption = null;
            return;
        }

        selectedOption = value;
        onSelect?.(value);
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
    class="selectButtonContainer"
    class:gotop={keepOnTop}
    style={keepOnTop ? `z-index: ${zIndex};` : ""}
>
    <p id={labelId} class="selectButtonLabel">{label}</p>

    <!-- Native mobile / touch select -->
    <div class="nativeSelectWrapper">
        <select
            id={nativeId}
            class="nativeSelect"
            class:hasInError={!!inputError}
            value={selectedOption ?? ""}
            on:change={handleNativeSelect}
            aria-labelledby={labelId}
            aria-invalid={!!inputError}
        >
            <option value="" disabled>Select...</option>

            {#each options as option}
                <option value={option}>{option}</option>
            {/each}
        </select>

        <div class="nativeArrowWrapper">
            <div class="nativeArrowContainer">
                <FolderNext color={"#b3b3b3"} />
            </div>
        </div>
    </div>

    <!-- Custom desktop select -->
    <div class="selectButtonAnchor">
        <div
            class="actualSelectButton"
            class:selopopen={isOpen}
            class:openUp={openUp}
            class:hasInError={!!inputError}
            bind:this={selectWrapperElement}
        >
            <button
                id={buttonId}
                type="button"
                class="selectedOptionButton"
                class:hasSelection={!!selectedOption}
                on:click={toggleOpen}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-labelledby={labelId}
                aria-invalid={!!inputError}
            >
                <span class="selectedOptionText">
                    {selectedOption || "Select..."}
                </span>

                <div class="selectArrowWrapper">
                    <div class="arrowContainer" class:rotateSelectArrow={isOpen}>
                        <FolderNext color={"#b3b3b3"} />
                    </div>
                </div>
            </button>

            <div
                id={listId}
                class="mySelOps"
                class:isOpen={isOpen}
                class:slectOpenUp={openUp}
                role="listbox"
                aria-labelledby={labelId}
            >
                {#each options as option, index}
                    <button
                        type="button"
                        role="option"
                        aria-selected={option === selectedOption}
                        class="selSingle"
                        class:isPicked={option === selectedOption}
                        class:firstOption={index === 0}
                        on:click={(event) => selectOption(event, option)}
                    >
                        <p class="opforsel">{option}</p>
                    </button>
                {/each}
            </div>
        </div>
    </div>
</div>

{#if showInputErrors && inputError}
    <div class="selectButtonError">
        <FormInputErrorText inputErrorText={inputError} />
    </div>
{/if}