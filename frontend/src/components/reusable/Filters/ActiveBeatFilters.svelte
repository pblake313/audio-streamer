<!-- <script lang="ts">
    import { beatKeyFilter, clearAllBeatFilters, clearArtistFilter, clearKeyFilter, clearModeFilter, clearMoodFilter, modeFilter, moodArray, selectedArtist } from '../../../stores/AudioPlayer/beatFilteringStore';
    import CloseIcon from '../../svg/Icons/CloseIcon.svelte';
    import './ActiveBeatFilters.css'
    export let padout = false

</script>

<div class="activeFilters" class:fixpad={padout} class:padtoppa={$selectedArtist || $moodArray.length >= 1 || $beatKeyFilter || $modeFilter}>
    
    {#if $selectedArtist}
        <button class="filterFlex" on:click={clearArtistFilter}>
            <p><span style="opacity: .6;">Artist:</span>
                {#if $selectedArtist}
                    {$selectedArtist}
                {:else}
                    None
                {/if}
            </p>
            <div class="filterCloseButton">
                <div class="wrapEx">
                    <CloseIcon height={'10px'} color={'f7f7f7'}></CloseIcon>
                </div>
            </div>
        </button>
    {/if}


    {#if $moodArray.length >= 1}
        <button class="filterFlex" on:click={clearMoodFilter} >
            <p><span style="opacity: .6;">Mood:</span>

                {#each $moodArray as mood, i}
                    <span >
                        {mood}{#if i !== $moodArray.length - 1}<span style="margin-right: 2px;">,</span>{/if}
                        
                    </span>
                {/each}
   
            </p>
            <div class="filterCloseButton">
                <div class="wrapEx">
                    <CloseIcon height={'10px'} color={'f7f7f7'}></CloseIcon>
                </div>
            </div>
        </button>
    {/if}


    
    {#if $beatKeyFilter}
        <button class="filterFlex" on:click={clearKeyFilter}>
            <p><span style="opacity: .6;">Key:</span>
                {#if $beatKeyFilter}
                    {$beatKeyFilter}
                {:else}
                    None
                {/if}
            </p>
            <div  class="filterCloseButton">
                <div class="wrapEx">
                    <CloseIcon height={'10px'} color={'f7f7f7'}></CloseIcon>
                </div>
            </div>
        </button>
    {/if}

    
    {#if $modeFilter}
        <button class="filterFlex" on:click={clearModeFilter}>
            <p><span style="opacity: .6;">Mode:</span>
                {#if $modeFilter}
                    {$modeFilter}
                {:else}
                    None
                {/if}
            </p>
            <div  class="filterCloseButton">
                <div class="wrapEx">
                    <CloseIcon height={'10px'} color={'f7f7f7'}></CloseIcon>
                </div>
            </div>
        </button>
    {/if}



    {#if $selectedArtist || $moodArray.length >= 1 || $beatKeyFilter || $modeFilter }
        <button on:click={clearAllBeatFilters} class="clearFiltersButton"> 
            <div class="clearFilterFlex">
                <div  class="filterCloseButton allFilts">
                    <div class="wrapC">
                        <CloseIcon height={'10px'} color={'222222'}></CloseIcon>
                    </div>
                </div>
                <p>Clear All</p>
            </div>
        </button>
    {/if}

</div>
{#if !$selectedArtist && $moodArray.length === 0 && !$beatKeyFilter && !$modeFilter}
    <p class="nofiltApplied">No Filters Applied</p>
{/if} -->