<!-- 
<script lang="ts">
    import { songModeOptions } from "$lib/selectoptions";
    import { onMount } from "svelte";
    import RightArrow from "../../svg/Icons/RightArrow.svelte";
    let optionsOpen: boolean = false;
    import './ModeFilter.css'
    import { createEventDispatcher } from 'svelte';
    import CheckIcon from "../../svg/Icons/CheckIcon.svelte";
    import { modeFilter } from "../../../stores/AudioPlayer/beatFilteringStore";
    const dispatch = createEventDispatcher();


    function toggleOptions() {
      optionsOpen = !optionsOpen;
    }

    function selectModeFilter(mode: string) {
        modeFilter.set(mode)
        dispatch('modeFilterSelected', mode)
        toggleOptions()

    }

    onMount(() => {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    });

    function handleClickOutside(event: MouseEvent) {
      // Cast the event target so we can use `.closest()`
      const target = event.target as HTMLElement;
      if (!target.closest('.wrapModeFilter')) {
        optionsOpen = false;
      }
    }
</script>



<div class="wrapModeFilter">
    <button class="moderTop" on:click={toggleOptions} class:modTOpen={optionsOpen}>
        <div class="modeHead">
            <p class="filtHeadT">Mode</p>
        </div>
        <div class="rrMode" >
            <div class="wA" class:modeSpin={optionsOpen}>
                <RightArrow color={'#f7f7f7'}/>
            </div>
        </div>
    </button>

    <div class="modeList" class:moderOpen={optionsOpen}>
        {#each songModeOptions as mode, i}
            <button class="modeePop" class:activeMode={$modeFilter === mode} on:click={(e) => {selectModeFilter(mode)}} class:lastModeOption={i === songModeOptions.length - 1}>
                <div class="inMode">
                    <div class="modeBox">
                        <div class="wrapCheck" >
                            <CheckIcon color={"#222222"} height={'10px'}></CheckIcon>
                        </div>
                    </div>
                    <p class="nermode">{mode}</p>
                </div>
            </button>
        {/each}
    </div>

  </div>
  


  {#if optionsOpen}
  <div role="none" class="screenBlocker" on:click={handleClickOutside}></div>
  {/if} -->