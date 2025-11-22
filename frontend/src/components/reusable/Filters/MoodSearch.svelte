<!-- <script lang="ts">
    import { onMount } from 'svelte';
    import { beatMoodOptions } from "$lib/selectoptions";
    import RightArrow from "../../svg/Icons/RightArrow.svelte";
    import './MoodSearch.css';
    import { createEventDispatcher } from 'svelte';
  import CheckIcon from '../../svg/Icons/CheckIcon.svelte';
  import { fade } from 'svelte/transition';
    import { moodArray } from '../../../stores/AudioPlayer/beatFilteringStore';
    const dispatch = createEventDispatcher();
  
    let optionsOpen: boolean = false;

    onMount(() => {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    });
  
    function openOptions() {
      optionsOpen = !optionsOpen;
    }
  
    // This function will close the moodList if the user clicks outside `.wrapMoodFilter`
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.wrapMoodFilter')) {
        optionsOpen = false;
      }
    }

    function pushMood(mood: string) {
        // Use the store's update method to safely modify the array
        moodArray.update((current) => {
            if (current.includes(mood)) {
                // Remove mood if it already exists
                return current.filter(item => item !== mood);
            } else {
                // Add mood if it doesn't exist
                return [...current, mood];
            }
        });

        dispatch('moodChange', mood)
    }

  </script>


    
  <div class="wrapMoodFilter">
    <button class="moodTopButton" on:click={openOptions} class:moodTopOpen={optionsOpen}>
      <p class="mhead">Mood</p>
      <div class="rrMood" >
        <div class="mA" class:mspin={optionsOpen}>
            <RightArrow color={'#f7f7f7'}/>
        </div>
    </div>
    </button>

    <div class="moodList" class:moodOpen={optionsOpen}>
        {#each beatMoodOptions as mood}
            <button class="moodOpButton" on:click={(e)=> {pushMood(mood)}} class:incMooder={$moodArray.includes(mood)}>
                <div class="innerMood" >
                    <div class="moodBox">
                        <div class="wrapCheck" style="margin-top: 1px;">
                            <CheckIcon color={"#222222"} height={'12px'}></CheckIcon>
                        </div>
                    </div>
                    <p class="moodOp">{mood}</p>
                </div>
            </button>
        {/each}
    </div>  

  </div>
  
  {#if optionsOpen}
  <div role="none" class="screenBlocker" on:click={handleClickOutside}></div>
  {/if} -->