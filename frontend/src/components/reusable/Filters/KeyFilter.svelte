<!-- <script lang="ts">
    import { onMount } from 'svelte';
    import { songKeyOptions } from '$lib/selectoptions';
    import RightArrow from '../../svg/Icons/RightArrow.svelte';
    import './KeyFilter.css';
    import { createEventDispatcher } from 'svelte';
    import CheckIcon from '../../svg/Icons/CheckIcon.svelte';
    import { beatKeyFilter } from '../../../stores/AudioPlayer/beatFilteringStore';
    const dispatch = createEventDispatcher();


    let optionsOpen = false;
    let wrapper: HTMLDivElement; // bind:this will store a reference here

  
    function toggleOptions() {
      optionsOpen = !optionsOpen;
    }
  
    // Close when clicked outside
    onMount(() => {
      function handleClickOutside(event: MouseEvent) {
        // If we have our wrapper and the click target is not inside it:
        if (wrapper && !wrapper.contains(event.target as Node)) {
          optionsOpen = false;
        }
      }
      document.addEventListener('click', handleClickOutside, true);

      return () => {
        document.removeEventListener('click', handleClickOutside, true);
      };
    });

    function selectFilterKey(key: string){
        beatKeyFilter.set(key)
        dispatch('keyFilterSelected', key)
        toggleOptions()
    }


  </script>
  
  <div class="wrapKeyFilter" bind:this={wrapper}>
    <button
      class="keyTopB"
      on:click={toggleOptions}
      class:keyTopOpen={optionsOpen}
    >

        <p class="kHead">Key</p>
 
        <div class="rrKey" >
            <div class="kA" class:kspin={optionsOpen}>
                <RightArrow color={'#f7f7f7'}/>
            </div>
        </div>
    </button>
  
    <div class="keyList" class:keyIsOpen={optionsOpen}>
        {#each songKeyOptions as key, i}
            <button class="keyOpButton" class:activeKey={$beatKeyFilter === key} on:click={(e)=> {selectFilterKey(key)}} class:lastKeyOption={i === songKeyOptions.length - 1}>
                <div class="innerKey">
                    <div class="keyBox">
                        <div class="wrapCheck" >
                            <CheckIcon color={'#222222'} height={'10px'}></CheckIcon>
                        </div>
                    </div>
                    <p class="keyOP">{key}</p>
                </div>
            </button>
        {/each}
    </div> 

  </div>


  {#if optionsOpen}
    <div role="none" class="screenBlocker"></div>
  {/if}
   -->