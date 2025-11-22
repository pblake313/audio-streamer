<!-- <script lang="ts">
    import { get } from 'svelte/store';
    import ArtistSearch from './Filters/ArtistSearch.svelte';
    import './BeatFilter.css';
    import AudioLoader from './Loaders/AudioLoader.svelte';
    import type { Beat } from '../../lib/types/Beats';
    import MoodSearch from './Filters/MoodSearch.svelte';
    import KeyFilter from './Filters/KeyFilter.svelte';
    import ModeFilter from './Filters/ModeFilter.svelte';
    import BoxButton from '../buttons/BoxButton.svelte';
    import ActiveBeatFilters from './Filters/ActiveBeatFilters.svelte';
    import CloseButton from '../buttons/CloseButton.svelte';
    import { fade } from 'svelte/transition';
  import FilterIcon from '../svg/Icons/FilterIcon.svelte';
    import { artistsSearched, beatKeyFilter, keysSearched, modeFilter, modesSearched, moodArray, moodsSearched, runBeatFilter, selectedArtist } from '../../stores/AudioPlayer/beatFilteringStore';
    import { allPublicBeatsFetched, publicBeats, pushBeatIntoAllPublicBeatsArray } from '../../stores/AudioPlayer/beatArrayStore';

    const backendLink = import.meta.env.VITE_BACKEND_URL;

    // $: console.log('Searched Artists: ', $artistsSearched)
    // $: console.log('Searched Moods', $moodsSearched)
    // $: console.log('Searched Keys', $keysSearched)
    // $: console.log('Searched Modes', $modesSearched)

    let loadingNewBeats: boolean = false

    let mobileBeatFiltersShown: boolean = false


    // when the artist changes
    async function artistUpdate(event: CustomEvent) {
        const selectedArtist = event.detail; // The artist name you clicked

        if (!selectedArtist || selectedArtist.trim().length === 0) {
            publicBeats.set(get(allPublicBeatsFetched));
            return;
        }

        if (!$artistsSearched.includes(selectedArtist)){
            // first fetch the new beats...
            try {
                await getBeatsByArtist(selectedArtist)
            } catch (error) {
                console.log('could not get beats by artist')
            }
        } else {
            console.log(`not searching for ${selectedArtist} because we already did.`)
        }

        runBeatFilter()
        scrollToStartBeatFilter()
    }

    async function getBeatsByArtist(artist: string) {
        try {
            loadingNewBeats = true
            let postObj = {
                artist
            }
            const response = await fetch(`${backendLink}/protected/fetch/get-beats-by-artist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postObj)
            });

            const result = await response.json();

            if (result.newBeats) {
                result.newBeats.forEach((beat: Beat) => pushBeatIntoAllPublicBeatsArray(beat))
            }

            artistsSearched.update(currentArray => {
                return [...currentArray, artist];
            });

            loadingNewBeats = false

        } catch (error) {
            loadingNewBeats = false
            console.log(error)
            throw new Error('An error occurred.')
        }

    }

    
    // when the mood changes
    async function moodChange(event: CustomEvent) {
        const newMood = event.detail

        if (!$moodsSearched.includes(newMood)){
            try {
                await getBeatsByMood(newMood)
            } catch {
                console.log('could not get new beats by mood.')
            }
        } else {
            // console.log(`not searching for mood ${newMood} because we already did.`)
        }

        runBeatFilter()
        scrollToStartBeatFilter()
    }
    async function getBeatsByMood(mood: string) {
        try {
            loadingNewBeats = true
            let postObj = {
                mood
            }
            const response = await fetch(`${backendLink}/protected/fetch/get-beats-by-mood`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postObj)
            });

            const result = await response.json()

            if (result.newBeats) {
                result.newBeats.forEach((beat: Beat) => pushBeatIntoAllPublicBeatsArray(beat))
            }

            moodsSearched.update(currentArray => {
                return [...currentArray, mood];
            });

            loadingNewBeats = false

        } catch {
            console.log('error getting beats by mood')
            loadingNewBeats = false

        }
    }

    // when the key changes
    async function keyUpdate(event: CustomEvent) {
        const newKey = event.detail


        if (!$keysSearched.includes(newKey)){
            try {
                await getBeatsByKey(newKey)
            } catch {
                console.log('an error occurred getting beats by key.')
            }
        } else {
            console.log('key has already been searched...')
        }

        runBeatFilter()
        scrollToStartBeatFilter()

    }

    async function getBeatsByKey(key:string) {
        try {
            loadingNewBeats = true
            let postObj = {
                key
            }
            const response = await fetch(`${backendLink}/protected/fetch/get-beats-by-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postObj)
            });

            const result = await response.json()
            if (result.newBeats) {
                result.newBeats.forEach((beat: Beat) => pushBeatIntoAllPublicBeatsArray(beat))
            }

            keysSearched.update(currentArray => {
                return [...currentArray, key];
            });

            loadingNewBeats = false
        } catch {
            loadingNewBeats = false
        }
    }

    async function modeUpdate(event: CustomEvent) {
        const newMode = event.detail
        

        if(!$modesSearched.includes(newMode)){
            try{    
                await getBeatsByMode(newMode)

            } catch {
                console.log('An error occurred getting beats by mode')
            }
        } else {
            console.log(`mode: ${newMode} has already been searched.`)
        }

        runBeatFilter()
        scrollToStartBeatFilter()

    }


    async function getBeatsByMode(mode: string) {
        try {
            loadingNewBeats = true
            let postObj = {
                mode
            }

            const response = await fetch(`${backendLink}/protected/fetch/get-beats-by-mode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postObj)
            });

            const result = await response.json()
            if (result.newBeats) {
                result.newBeats.forEach((beat: Beat) => pushBeatIntoAllPublicBeatsArray(beat))
            }

            modesSearched.update(currentArray => {
                return [...currentArray, mode];
            });

            loadingNewBeats = false

        } catch {
            loadingNewBeats = false

        }
    }

    let isMobileScreen = false;

    $: isMobileScreen = window.innerWidth < 900;

    // Reactive statement to disable scrolling when filters are open and screen is mobile
    $: {
        if (mobileBeatFiltersShown && isMobileScreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = ''; // Reset to default
        }
    }

    function closeMobileBeatFiltersShown(){
        mobileBeatFiltersShown = false
    }

    function openFilters(){
        mobileBeatFiltersShown = true
    }

    function scrollToStartBeatFilter() {
        const element = document.getElementById('bottomOfHighlightedTrack');
        if (element) {
            const offset = 65; // Offset of 100px
            const topPosition = element.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({
                top: topPosition,
                behavior: 'smooth'
            });
        } else {
            console.error('Element with id "startBeatFilter" not found.');
        }
    }

</script> -->

<!-- <div id='bottomOfHighlightedTrack'></div> 

<div class="wrapEntireBeatFilter" id="startBeatFilter">

    <div class="wrapBeatFilter" class:miniBottomPad={$selectedArtist || $moodArray.length >= 1  || $beatKeyFilter || $modeFilter}>

        <div class="wrapArtistSearch deskerArt">
            <ArtistSearch on:artistSelected={artistUpdate}/>
        </div>


        <div class="wrapFilters">
            <div class="wrapDesktopFilters">
                <div class="moodSearchWrapper">
                    <MoodSearch on:moodChange={moodChange}/>
                </div>
                <div class="moodSearchWrapper">
                    <KeyFilter on:keyFilterSelected={keyUpdate}/>
                </div>
                <div class="moodSearchWrapper">
                    <ModeFilter on:modeFilterSelected={modeUpdate}/>
                </div>
      
            </div>

            <div class="mobileFilters">

                <div class="mobileActiveFilters">

                    <ActiveBeatFilters></ActiveBeatFilters>
                </div>
                <div class="mobileFilterButton">
                    <BoxButton on:click={openFilters} buttonIcon={'filter'} buttonText={'Filters'} buttonStyle={'opacityIncrease'} noPad={true}></BoxButton>
                </div>
                <button class="miniMobileFilter" on:click={openFilters}>
                    <FilterIcon color={"f7f7f7"} height={'16px'}></FilterIcon>
                </button>
            
            </div>
  
        </div>
    
    </div>
    
    
    <div class="desktopActiveFilters">
        <ActiveBeatFilters></ActiveBeatFilters>
    </div>
   
    <div class="newBeatsFetching" class:openLoadNewBeats={loadingNewBeats}>
        <AudioLoader></AudioLoader>
    </div>
    
    {#if $selectedArtist || $moodArray.length >= 1  || $beatKeyFilter || $modeFilter }
        <div class="filtpadder"></div>
    {/if}

</div>


{#if mobileBeatFiltersShown}
    <div class="mobBeatFilters" in:fade={{ duration: 200 }} out:fade={{ duration: 200}}> 

        <div class="flexFiltas">
            <p style="font-size: 13pt;"><b>Filter Beats</b></p>
            <CloseButton color={'f7f7f7'} on:click={closeMobileBeatFiltersShown}></CloseButton>
        </div>
        <ActiveBeatFilters padout={true}></ActiveBeatFilters>
        <br>
        <div class="wrapArtistSearch mobArtS">
            <ArtistSearch on:artistSelected={(e) => {artistUpdate(e), closeMobileBeatFiltersShown()}}/>
        </div>
        <MoodSearch on:moodChange={(e) => {moodChange(e)}}/>
        <KeyFilter on:keyFilterSelected={(e)=> {keyUpdate(e), closeMobileBeatFiltersShown()}}/>
        <ModeFilter on:modeFilterSelected={(e)=> {modeUpdate(e), closeMobileBeatFiltersShown()}}/>
    </div>
{/if} -->

