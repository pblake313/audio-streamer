<script lang="ts">
    import { fade } from "svelte/transition";
    import { selectedBeat } from "../../stores/AudioPlayer/selectedBeatStore";
    import './HighlightedTrack.css'
    import { audioPlayerState, pauseTrack, playTrack, resetTrackTimer, smartNextTrack, smartPreviousTrack, userTapped } from "../../stores/AudioPlayerStore";
    import SoundPlaying from "../svg/Icons/SoundPlaying.svelte";
    import SeekButton from "../buttons/music/SeekButton.svelte";
    import PlayPauseButton from "../buttons/music/PlayPauseButton.svelte";
    import AudioRange from "./AudioRange.svelte";
    import SpinLoader from "../reusable/Loaders/SpinLoader.svelte";

    let playOrPauseIcon = 'play'; // initial state

    $: if ($audioPlayerState !== 'Loading') {
        playOrPauseIcon = $audioPlayerState === 'Playing' ? 'pause' : 'play';
    }

</script>


{#if $selectedBeat}
    <div class="wrapHighlightedTrack">

        <div class="topperGradient"></div>
        <div class="bommo"></div>

        {#key $selectedBeat}
            <img in:fade={{duration: 600}} out:fade={{duration: 600}} class="highlightedTrackBackground" src="{$selectedBeat.artworkUrl}" alt="{$selectedBeat.beatTitle}">
        {/key}

        <div class="insideHighlight">

            <div class="holdBeatArt">
                <button class="artworkPlayPauseButton">
                    {#key $selectedBeat}
                        <img in:fade={{duration: 600}} out:fade={{duration: 600}} class="trackArtworkImage" src="{$selectedBeat.artworkUrl}" alt="{$selectedBeat.beatTitle}">
                    {/key}
                </button>

                <div class="smallerTrackInfo">

                    <div class="trackInfoTop">
                        <!-- track state -->
                        <div class="trackStateFlex">
    
                            {#if $audioPlayerState === 'Playing' || $audioPlayerState === 'Loading' }
                                <div class="trackIcon">
                                    {#if $audioPlayerState === 'Playing'}
                                        <div out:fade={{duration: 300}} in:fade={{duration: 300}}>
                                            <SoundPlaying color={'#f7f7f7'}></SoundPlaying>
                                        </div>
                                    {:else if $audioPlayerState === 'Loading'}
                                        <SpinLoader height={'10px'}></SpinLoader>

                                    {/if}
                                </div>
                            {/if}
                
                            <div class="trackStateText">
                                {#if $audioPlayerState === 'Idle'}
                                    <p>Waiting</p>
                                    {:else}
                                    <p>{$audioPlayerState}</p> 
                                {/if}
                            </div>
                    
                        </div>
    
                        <div class="wrapHighlightedTitle">
                            <h2>{$selectedBeat.beatTitle}</h2>
                            
                            {#if $audioPlayerState === 'Playing' || $audioPlayerState === 'Loading' }
                                <div class="mobTrackIcon" >
                                    {#if $audioPlayerState === 'Playing'}
                                        <div out:fade={{duration: 300}} in:fade={{duration: 300}}>
                                            <SoundPlaying color={'#f7f7f7'}></SoundPlaying>
                                        </div>
                                    {:else if $audioPlayerState === 'Loading' && $userTapped}
                                        <div out:fade={{duration: 300}} in:fade={{duration: 300}}>
                                            <SpinLoader height={'15px'}></SpinLoader>
                                        </div>

                                    {/if}
                                </div>
                            {/if}
                        </div>
                        <p class="keyandMode">{$selectedBeat.key} {$selectedBeat.mode} - {$selectedBeat.bpm} BPM</p>
    
                    </div>
                    
                    <div class="trackControls">

                        <!-- empty div for styling purposes -->
                        <div></div>

                        <div>

                            <AudioRange imageUrl={$selectedBeat?.artworkUrl || null}></AudioRange>

                            <div class="highlightedTrackControls">
                                <SeekButton iconHeight={'12px'} on:seek={()=>{resetTrackTimer(), smartPreviousTrack()}} rewindOrForward={'rewind'}></SeekButton>
                                <div class="wPlayPlauser">
                                    <PlayPauseButton
                                    playOrPause={$audioPlayerState === 'Playing' ? 'pause' : 'play'}
                                    on:togglePlayPause={() => {
                                        resetTrackTimer();
                                        $audioPlayerState === "Playing" ? pauseTrack() : playTrack();
                                    }}
                                    color={'#f7f7f7'}
                                    playIconHeight={'22px'}
                                    pauseIconHeight={'20px'}
                                    height={'50px'}></PlayPauseButton>
                                </div>
                                <SeekButton iconHeight={'12px'} on:seek={()=>{resetTrackTimer(), smartNextTrack()}}></SeekButton>
                            </div>

                        </div>
              
                    </div>
                </div>

            </div>



            <div class="highlightedTrackInfo">
                
                <div class="trackInfoTop">
                    <!-- track state -->
                    <div class="trackStateFlex">

                        {#if $audioPlayerState === 'Playing' || $audioPlayerState === 'Loading' }
                            <div class="trackIcon">
                                {#if $audioPlayerState === 'Playing'}
                                    <SoundPlaying color={'#f7f7f7'}></SoundPlaying>
                                {:else if $audioPlayerState === 'Loading' && $userTapped}
                                    <SpinLoader height={'15px'}></SpinLoader>
                                {/if}
                            </div>
                        {/if}
            
                        <div class="trackStateText">
                            {#if $audioPlayerState === 'Idle'}
                                <p>Waiting</p>
                                {:else}
                                <p>{$audioPlayerState}</p> 
                            {/if}
                        </div>
                
                    </div>

                    <div class="wrapHighlightedTitle">
                        <h2>{$selectedBeat.beatTitle}</h2>
                    </div>
                    <p class="keyandMode">{$selectedBeat.key} {$selectedBeat.mode} - {$selectedBeat.bpm} BPM</p>

                </div>


                <div class="trackInfoBottom">


                    <div class="trackControls">

                        <!-- empty div for styling purposes -->
                        <div></div>

                        <div>

                            <AudioRange imageUrl={$selectedBeat?.artworkUrl || null}></AudioRange>

                            <div class="highlightedTrackControls">
                                <SeekButton iconHeight={'12px'} on:seek={()=>{resetTrackTimer(), smartPreviousTrack()}} rewindOrForward={'rewind'}></SeekButton>
                                <div class="wPlayPlauser">
                                    <PlayPauseButton
                                    playOrPause={$audioPlayerState === 'Playing' ? 'pause' : 'play'}
                                    on:togglePlayPause={() => {
                                        resetTrackTimer();
                                        $audioPlayerState === "Playing" ? pauseTrack() : playTrack();
                                    }}
                                    color={'#f7f7f7'}
                                    playIconHeight={'22px'}
                                    pauseIconHeight={'20px'}
                                    height={'50px'}></PlayPauseButton>
                                </div>
                                <SeekButton iconHeight={'12px'} on:seek={()=>{resetTrackTimer(), smartNextTrack()}}></SeekButton>
                            </div>

                        </div>
         
              
                    </div>


                </div>

            </div>

        </div>
    
    </div>
{/if}
