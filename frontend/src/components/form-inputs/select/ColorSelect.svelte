<script lang="ts">
    import FolderNext from '../../Icons/svg/FolderNext.svelte';
    import FormInputErrorText from '../../errors/FormInputErrorText.svelte';
    import './ColorSelect.css';
    import { onDestroy, onMount } from 'svelte';

    export let colorOptions: {
        color: string;
        colorName: string;
    }[] = [];

    export let label: string = `Enter 'label'`;
    export let id: string = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    export let selectedOption: string | null = null; // hex string, no "#"
    export let inputError: string | null = null;
    export let showInputErrors: boolean = true;

    // Svelte 5 replacement for dispatcher: callback prop
    export let onSelect: ((option: string) => void) | undefined;

    let isOpen = false;
    let openUp = false; // true => dropdown opens upward
    let selectWrapperElement: HTMLElement | null = null;
    let optionsHeight = 0;
    let typedChar = '';
    let typingTimeout: ReturnType<typeof setTimeout>;

    // derived selected color object (for label)
    $: selectedColorOption =
        colorOptions.find((c) => c.color === selectedOption) ?? null;

    function openAndMeasure() {
        const optionsElement = document.getElementById(`options-${id}`);
        if (!selectWrapperElement || !optionsElement) return;

        const rect = selectWrapperElement.getBoundingClientRect();
        const viewportH = window.innerHeight;

        // if button's top is in the bottom 50% of screen → open upwards
        openUp = rect.top >= viewportH * 0.5;

        const margin = 15;
        const spaceBelow = Math.max(0, viewportH - rect.bottom - margin);
        const spaceAbove = Math.max(0, rect.top - margin);

        const contentHeight = optionsElement.scrollHeight;

        // cap to available space in the chosen direction
        optionsHeight = Math.min(
            contentHeight,
            openUp ? spaceAbove : spaceBelow
        );
    }

    function toggleOpen() {
        isOpen = !isOpen;
        if (isOpen) openAndMeasure();
        else optionsHeight = 0;
    }

    function selectOption(event: MouseEvent | KeyboardEvent, option: string) {
        event.stopPropagation();
        selectedOption = option;
        onSelect?.(option);
        isOpen = false;
        optionsHeight = 0;
    }

    function handleClickOutside(event: MouseEvent) {
        if (selectWrapperElement && !selectWrapperElement.contains(event.target as Node)) {
            isOpen = false;
            optionsHeight = 0;
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            isOpen = false;
            optionsHeight = 0;
            return;
        }

        if (!isOpen || !colorOptions.length) return;

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => (typedChar = ''), 500);

        if (event.key === 'Enter' && selectedOption) {
            selectOption(event, selectedOption);
            return;
        }

        // type-to-search by colorName
        typedChar += event.key.toLowerCase();

        const match = colorOptions.find((c) =>
            c.colorName.toLowerCase().startsWith(typedChar)
        );
        if (match) {
            const optionIndex = colorOptions.indexOf(match);
            const optionsElement = document.getElementById(`options-${id}`);
            if (optionsElement) {
                const optionButton = optionsElement.children[optionIndex] as HTMLElement | undefined;
                optionButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    const resizeHandler = () => {
        if (isOpen) openAndMeasure();
    };

    const scrollHandler = () => {
        if (isOpen) openAndMeasure();
    };

    onMount(() => {
        window.addEventListener('click', handleClickOutside);
        window.addEventListener('keydown', handleKeyPress);
        window.addEventListener('resize', resizeHandler);
        window.addEventListener('scroll', scrollHandler, { passive: true });
    });

    onDestroy(() => {
        window.removeEventListener('click', handleClickOutside);
        window.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('scroll', scrollHandler);
    });
</script>

<div class="colorSelectContainer" class:colorSelectZTop={isOpen}>
    <label class="colorSelectLabel" for={id}>
        <p>{label}</p>
    </label>
    <div class="colorSelectSpacer"></div>

    <button
        class="colorSelectButton"
        class:colorSelectOpen={isOpen}
        class:colorSelectHasError={!!inputError}
        bind:this={selectWrapperElement}
        type="button"
        on:click={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`options-${id}`}
        id={id}
    >
        {#if selectedColorOption}
            <div class="colorSelectRow selectedColorRow">
                <span
                    class="colorSelectDot"
                    style={`background-color: #${selectedColorOption.color}`}
                ></span>

                <div class="colorSelectTextWrapper">
                    <p
                        class="colorSelectText"
                        class:colorSelectTextOpen={isOpen}
                        class:colorSelectHasSelection={!!selectedOption}
                    >
                        {selectedColorOption.colorName}
                    </p>
                </div>

            </div>
        {:else}
            <p
                class="colorSelectText"
                class:colorSelectTextOpen={isOpen}
            >
                Select...
            </p>
        {/if}

        <div class="colorSelectArrowWrapper">
            <div class="colorSelectArrowContainer" class:colorSelectArrowRotated={isOpen}>
                <FolderNext color={'#b3b3b3'} />
            </div>
        </div>
    </button>

    <div
        id={`options-${id}`}
        class="colorSelectOptions"
        class:colorSelectOptionsOpen={isOpen}
        class:colorSelectOpenUp={openUp}
        style:height={isOpen ? optionsHeight + 'px' : '0px'}
        role="listbox"
        aria-labelledby={id}
    >
        {#each colorOptions as c}
            <button
                type="button"
                class={selectedOption === c.color
                    ? 'colorSelectOptionButton colorSelectOptionPicked'
                    : 'colorSelectOptionButton'}
                on:click={(ev) => selectOption(ev, c.color)}
            >
                <div class="colorSelectRow">
                    <span class="colorSelectDot" style={`background-color: #${c.color}`}></span>
                    <div class="colorSelectTextWrapper">
                        <p class="colorSelectOptionLabel">{c.colorName}</p>
                    </div>
                </div>
            </button>
        {/each}
    </div>
</div>

{#if showInputErrors && inputError}
    <div>
        <FormInputErrorText inputErrorText={inputError} />
    </div>
{/if}
