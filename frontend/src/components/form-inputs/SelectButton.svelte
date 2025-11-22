<script lang="ts">
    import FormInputErrorText from './FormInputErrorText.svelte';
    import FolderNext from '../Icons/FolderNext.svelte';
    import './SelectButton.css'
    import { onDestroy, onMount } from 'svelte';

    export let options: string[] = [];
    export let label: string = `Enter 'label'`;
    export let id: string = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    export let selectedOption: string | null = null;
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

        if (!isOpen || !options.length) return;

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => (typedChar = ''), 500);

        if (event.key === 'Enter' && selectedOption) {
            selectOption(event, selectedOption);
            return;
        }

        typedChar += event.key.toLowerCase();

        const match = options.find((o) => o.toLowerCase().startsWith(typedChar));
        if (match) {
            const optionIndex = options.indexOf(match);
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

<div class="selectButtonContainer" class:gotop={isOpen}>
    <label class="selectButtonLabel" for={id}>
        <p>{label}</p>
    </label>
    <div class="dummySelectArea"></div>

    <button
        class="actualSelectButton"
        class:selopopen={isOpen}
        class:hasInError={!!inputError}
        bind:this={selectWrapperElement}
        type="button"
        on:click={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`options-${id}`}
        id={id}
    >
        <div class="containSelOp">
            {#if selectedOption}
                <p class={isOpen ? 'selectedOptionText selectedOpen hasSelection' : 'selectedOptionText hasSelection'}>
                    {selectedOption}
                </p>

            {:else}
                <p class={isOpen ? 'selectedOptionText selectedOpen' : 'selectedOptionText'}>Select...</p>
            {/if}
        </div>
  

        <div class="selectArrowWrapper">
            <div class="arrowContainer" class:rotateSelectArrow={isOpen}>
                <FolderNext color={'#b3b3b3'} />
            </div>
        </div>
    </button>

    <div
        id={`options-${id}`}
        class="mySelOps"
        class:isOpen={isOpen}
        class:openUp={openUp}
        style:height={isOpen ? optionsHeight + 'px' : '0px'}
        role="listbox"
        aria-labelledby={id}
    >
        {#each options as option}
            <button
                type="button"
                class={option === selectedOption ? 'selSingle isPicked' : 'selSingle'}
                on:click={(event) => selectOption(event, option)}
            >
                <p class="opforsel">{option}</p>
            </button>
        {/each}
    </div>
</div>

{#if showInputErrors && inputError}
    <div>
        <FormInputErrorText inputErrorText={inputError} />
    </div>
{/if}
