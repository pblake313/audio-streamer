<!-- <script lang="ts">
  import { writable, get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { tagOptions } from '$lib/selectoptions';
  import { createEventDispatcher } from 'svelte';
  import CloseIcon from '../../svg/Icons/CloseIcon.svelte';
  import SearchIcon from '../../svg/Icons/SearchIcon.svelte';
  import './ArtistSearch.css'
    import { clearArtistFilter, selectedArtist } from '../../../stores/AudioPlayer/beatFilteringStore';

  function shuffleArray(array: string[]): string[] {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  const filteredOptions = writable(shuffleArray(tagOptions));
  const dispatch = createEventDispatcher();

  let isSearchOpen = false;
  let wrapRef: HTMLDivElement;

  onMount(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapRef && !wrapRef.contains(event.target as Node)) {
        isSearchOpen = false;
      }
    }

    document.addEventListener('click', handleClickOutside, true);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  });

  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    const rawValue = target.value.toLowerCase().trim();

    if (!rawValue) {
        filteredOptions.set(shuffleArray(tagOptions));
        isSearchOpen = false;
        return;
    }

    const sanitizedValue = rawValue.replace(/[\s'"]/g, '');
    const newOptions = tagOptions.filter(option =>
        option.toLowerCase().replace(/[\s'"]/g, '').includes(sanitizedValue)
    );

    filteredOptions.set(shuffleArray(newOptions));

    // Always show the dropdown if the user typed something
    isSearchOpen = true;
    }


  function handleClickArtist(artist: string) {
    selectedArtist.set(artist);
    dispatch('artistSelected', artist);
    isSearchOpen = false;
  }

  function handleFocusOut(event: FocusEvent) {
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement | null;

    if (relatedTarget && !currentTarget.contains(relatedTarget)) {
      isSearchOpen = false;
    }
  }

  // ↓↓↓ handleKeyDown that checks for Enter
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const options = get(filteredOptions);
      if (options.length > 0) {
        handleClickArtist(options[0]);
      }
    }
  }
</script>

<div 
  bind:this={wrapRef}
  class="wrapSearchAndArtists {isSearchOpen ? 'isSearchOpen' : ''}" 
  on:focusout={handleFocusOut}
  tabindex="-1"
>
  <label for="artistSearch" class="mag">
    <SearchIcon height={'20px'} color={'#848484'} />
  </label>

  <input
    placeholder="Search Artists..."
    type="text"
    id="artistSearch"
    class="artistSearchInput"
    value={$selectedArtist}
    on:input={handleSearch}
    on:focus={() => (isSearchOpen = true)}
    on:keydown={handleKeyDown}  
    autocomplete="off"
  />

  <div class="allArtists">
    {#if $filteredOptions.length > 0}
        {#each $filteredOptions as artist, i}
            <button
                class="artistButton"
                class:lastArtist={i === $filteredOptions.length - 1}
                on:click={() => handleClickArtist(artist)}
            >
                <p>{artist}</p>
            </button>
        {/each}
    {:else}
      <button class="artistButton lastArtist">
        <p>No results found...</p>
      </button>
    {/if}
  </div>

  {#if $selectedArtist.length > 0}
    <button class="searchClose" on:click={() => {clearArtistFilter(), filteredOptions.set(shuffleArray(tagOptions)); }}>
      <CloseIcon height={'15px'} color={'e3e3e3'} />
    </button>
  {/if}
</div> -->
