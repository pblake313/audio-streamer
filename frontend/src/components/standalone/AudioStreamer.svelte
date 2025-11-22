<script lang="ts">
    import { selectedBeat } from "../../stores/AudioPlayer/selectedBeatStore";
    import { audioPlayerState, audioPlayerUrl, audioStore, autoPlayTrack, inTimeout, nextTrack, pauseTrack, playTrack, previousTrack, resetTrackTimer, restartTrack, smartNextTrack, smartPreviousTrack, stopTrack, useAutoPlay } from "../../stores/AudioPlayerStore";
    import { get } from 'svelte/store';
    import AudioRange from "./AudioRange.svelte";
    import './AudioStreamer.css'
    import SeekButton from "../buttons/music/SeekButton.svelte";
    import PlayPauseButton from "../buttons/music/PlayPauseButton.svelte";
    import { scrolledTwoFifty } from "../../stores/AudioStyleStore";
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    import Modal from "../reusable/Modal.svelte";
    import BoxButton from "../buttons/BoxButton.svelte";
    import CloseButton from "../buttons/CloseButton.svelte";
    import { goto } from "$app/navigation";

    // Ensure audio.src is updated when beat changes
    $: if ($audioPlayerUrl) {
        const audio = get(audioStore);
        if (audio) {
            audio.src = $audioPlayerUrl;
            if ($useAutoPlay) {
                autoPlayTrack();
                useAutoPlay.set(false);
            }
        }
    }


    // Function that checks if the page has scrolled 500 pixels or more
    function checkScrollPosition() {
        if (window.scrollY >= 250) {
            scrolledTwoFifty.set(true);
        } else {
            scrolledTwoFifty.set(false);
        }
    }

    // Attach the scroll event listener on mount
    onMount(() => {
        window.addEventListener('scroll', checkScrollPosition);
        // Run it once immediately to set the initial state
        checkScrollPosition();
        return () => {
            window.removeEventListener('scroll', checkScrollPosition);
        };
    });

    $: isOnBeatsRoute = $page.url.pathname === '/portal';


    $: hideStreamPlayer =
    (!$scrolledTwoFifty && isOnBeatsRoute) ||
    ($audioPlayerState === 'Idle');

</script>



{#if $selectedBeat}
    <div class="audioStreamWrapper" class:hideStreamPlayer={hideStreamPlayer || $inTimeout}> 
        <AudioRange roundedEdges={false} showTrackTime={false} imageUrl={$selectedBeat.artworkUrl || null}></AudioRange>

        <div class="innerAudio">


            <!-- fade help -->
            <button class="bottomArt" on:click={()=> {goto('/portal')}}> 
                <img class="miniArt" src="{$selectedBeat.artworkUrl}" alt="{$selectedBeat.beatTitle}">
            </button>

            <div class="streamInfoFlex">
                <!-- fade help -->
                <div class="trackInfoStream">
                    <p>{$selectedBeat.beatTitle}</p>
                    <p style="opacity: .5; font-size: 9pt">{$selectedBeat.bpm} BPM - {$selectedBeat.key} {$selectedBeat.mode}</p>
                </div>

                <!-- fade help -->
                <div class="streamTrackControls">
                    <div class="wrapSeeka">
                        <SeekButton iconHeight={'12px'} on:seek={()=>{resetTrackTimer(), smartPreviousTrack()}} rewindOrForward={'rewind'}></SeekButton>
                    </div>
                    <PlayPauseButton
                        playOrPause={$audioPlayerState === 'Playing' ? 'pause' : 'play'}
                        on:togglePlayPause={$audioPlayerState === "Playing" ? pauseTrack : playTrack}
                        color={'#f7f7f7'}
                        playIconHeight={'22px'}
                        pauseIconHeight={'20px'}
                        height={'50px'}>
                    </PlayPauseButton>
                    <div class="wrapSeeka">
                        <SeekButton iconHeight={'12px'} on:seek={()=>{resetTrackTimer(), smartNextTrack()}}></SeekButton>
                    </div>

                    <div class="closeSplit"></div>

                    <CloseButton on:click={stopTrack} iconThickness={'thick'} color={'f7f7f7'}></CloseButton>
                </div>
            </div>

        </div>
        
    </div>

{/if}

{#if $inTimeout}
    <Modal modalTitle={'Still Listening?'} on:closeModal={resetTrackTimer}>
            <div
                style="text-align: left;"
            >
            <br>
            <p>Are you still there?</p>
            <br>
            <div style="display: flex; justify-content: space-between;">
                <div></div>
                <BoxButton buttonStyle={'stayWhite'} fullWidth={true} buttonText={'Yes'} on:click={(e)=>  {resetTrackTimer(), playTrack()}}></BoxButton>
            </div>
        </div>
    </Modal>
{/if}
