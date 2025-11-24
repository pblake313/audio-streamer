<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import './MultiSelect.css';
    import FolderNext from '../../Icons/svg/FolderNext.svelte';
    import Checkmark from '../../misc/Checkmark.svelte';

	export let options: string[] = [];
	export let label: string = `Enter 'Label'`;
	export let selected: string[] = [];

	// Svelte 5 style: callback prop instead of dispatcher
	export let onChange: ((value: string[]) => void) | undefined;

	// similar props/flags as SelectButton
	export let id: string = `multi-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

	// NEW: auto-close behavior flag
	export let useAutoClose: boolean = false;

	let isOpen = false;
	let openUp = false;
	let wrapper: HTMLDivElement | null = null;
	let optionsElement: HTMLDivElement | null = null;
	let optionsHeight = 0;

	function openAndMeasure() {
		if (!wrapper || !optionsElement) return;

		const rect = wrapper.getBoundingClientRect();
		const viewportH = window.innerHeight;

		// mimic SelectButton logic: if trigger is in bottom half, open up
		openUp = rect.top >= viewportH * 0.5;

		const margin = 15;
		const spaceBelow = Math.max(0, viewportH - rect.bottom - margin);
		const spaceAbove = Math.max(0, rect.top - margin);

		const contentHeight = optionsElement.scrollHeight;

		optionsHeight = Math.min(contentHeight, openUp ? spaceAbove : spaceBelow);
	}

	function toggleOpenOptions() {
		isOpen = !isOpen;
		if (isOpen) {
			openAndMeasure();
		} else {
			optionsHeight = 0;
		}
	}

	function toggleSelect(value: string) {
		if (selected.includes(value)) {
			selected = selected.filter((item) => item !== value);
		} else {
			selected = [...selected, value];
		}

		onChange?.(selected);

		if (useAutoClose) {
			isOpen = false;
			optionsHeight = 0;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (wrapper && !wrapper.contains(event.target as Node)) {
			isOpen = false;
			optionsHeight = 0;
		}
	}

	const resizeHandler = () => {
		if (isOpen) openAndMeasure();
	};

	const scrollHandler = () => {
		if (isOpen) openAndMeasure();
	};

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		window.addEventListener('resize', resizeHandler);
		window.addEventListener('scroll', scrollHandler, { passive: true });
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
		window.removeEventListener('resize', resizeHandler);
		window.removeEventListener('scroll', scrollHandler);
	});
</script>


<div class="selectButtonContainer wrapAllMulti" class:gotop={isOpen} bind:this={wrapper}>
	<label class="selectButtonLabel" for={id}>
		<p>{label}</p>
	</label>

	<!-- Reserve space just like SelectButton -->
	<div class="dummySelectArea"></div>

	<button
		class="actualSelectButton multiStartButton"
		class:openMultiStart={isOpen}
		type="button"
		on:click={toggleOpenOptions}
		id={id}
	>
		<div class="multiStartFlex">
			{#if selected.length > 0}
				<p>{selected.join(', ')}</p>
			{:else}
				<p>No selections</p>
			{/if}

			<div class="selectArrowWrapper">
				<div class="arrowContainer" class:rotateSelectArrow={isOpen}>
                    <FolderNext color={'#b3b3b3'}></FolderNext>
				</div>
			</div>
		</div>
	</button>

	<div
		bind:this={optionsElement}
		class="mySelOps multiSelectOptionsWrapper"
		class:isOpen={isOpen}
		class:openUp={openUp}
		style:height={isOpen ? optionsHeight + 'px' : '0px'}
	>
		{#each options as opp}
			<button
				type="button"
				class:selectedOption={selected.includes(opp)}
				class="multiOptionButton"
				on:click={() => toggleSelect(opp)}
			>
				<div class="insideMulti">
					<Checkmark isChecked={selected.includes(opp)} />
					<p class="multiOptionText">{opp}</p>
				</div>
			</button>
		{/each}
	</div>
</div>
