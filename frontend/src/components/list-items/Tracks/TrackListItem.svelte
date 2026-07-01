<script lang="ts">
    import "./TrackListItem.css";
    import SoundPlaying from "../../Icons/svg/SoundPlaying.svelte";
    import {
        selectedBeat,
        selectNewBeat,
    } from "../../../stores/AudioPlayer/selectedBeatStore";
    import {
        audioPlayerState,
        pauseTrack,
        playTrack,
        useAutoPlay,
        userTapped,
    } from "../../../stores/AudioPlayerStore";
    import { get } from "svelte/store";
    import MoreIcon from "../../Icons/svg/MoreIcon.svelte";
    import StarIcon from "../../Icons/svg/StarIcon.svelte";
    import PauseIcon from "../../Icons/svg/PauseIcon.svelte";
    import type { Beat } from "../../../lib/types/Beats";
    import Modal from "../../misc/Modal.svelte";
    import PlayIcon from "../../Icons/svg/PlayIcon.svelte";
    import PopupBeat from "../../misc/PopupBeat.svelte";
    import AlbumArtwork from "../../UI/AlbumArtwork.svelte";
    import Loader from "../../loaders/Loader.svelte";
    import { fade } from "svelte/transition";
    import BeatTagsSwiper from "../../standalone/BeatTagsSwiper.svelte";
    import { getDateAgeInDays } from "../../../helpers/formatters";
    import Destinations from "./Destinations.svelte";

    export let isEven: boolean = false;
    export let beat: Beat;
    export let selectedMoreBeat: Beat | null = null;

    export function selectAndPlay() {
        const currentSelection = get(selectedBeat);

        if (currentSelection === beat ) {
            // console.log('already the same beat')

            if (currentSelection === beat && $audioPlayerState === "Playing") {
                pauseTrack();
            }
            if (currentSelection === beat && $audioPlayerState !== "Playing") {
                playTrack();
            }

            return;
        }
        useAutoPlay.set(true);
        selectNewBeat(beat);
    }

    function selectMoreBeat(e: MouseEvent) {
        e.stopPropagation(); // prevents triggering the outer button
        selectedMoreBeat = beat;
    }
    function resetSelectedMoreBeat() {
        selectedMoreBeat = null;
    }


</script>

<button
    type="button"
    class="tli_button"
    class:evenButton={isEven}
    on:click={selectAndPlay}
>
    <!-- artwork -->
    <div class="tli_artworkContainer">
        <AlbumArtwork width={"100%"} imageUrl={beat.artworkUrl} />

        <!-- if its the selected beat -->
        {#if $selectedBeat?.beatTitle === beat.beatTitle && $userTapped}
            <div
                class="tli_playOverlay tli_selectedTrackOverlay"
                class:hiderJ={["Paused", "Idle"].includes($audioPlayerState)}
                class:goHide={$audioPlayerState === "Paused" ||
                    $audioPlayerState === "Idle"}
            >
                {#if $audioPlayerState === "Playing"}
                    <div class="tli_wrapIcon" in:fade={{duration: 150}} out:fade={{duration:150}}>
                        <SoundPlaying color={"#f7f7f7"}></SoundPlaying>
                    </div>
                {/if}

                {#if ["Buffering", "Loading"].includes($audioPlayerState)}
                    <div class="tli_wrapIcon" in:fade={{duration: 150}} out:fade={{duration:150}}>
                        <Loader height={"30px"} />
                    </div>
                {/if}
            </div>
        {/if}

        <div class="tli_playOverlay tli_playPauseOverlay">
            <!-- if its the selected beat -->
            {#if $selectedBeat?.beatTitle === beat.beatTitle}
                {#if ["Paused", "Idle"].includes($audioPlayerState)}
                    <div class="tli_wrapIcon" in:fade={{duration: 150}} out:fade={{duration:150}}>
                        <PlayIcon color={"#f7f7f7"}></PlayIcon>
                    </div>
                {/if}
                {#if ["Playing"].includes($audioPlayerState)}
                    <div class="tli_wrapIcon" in:fade={{duration: 150}} out:fade={{duration:150}}>
                        <PauseIcon color={"#f7f7f7"}></PauseIcon>
                    </div>
                {/if}

                {#if ["Loading", "Buffering"].includes($audioPlayerState)}
                    <div class="tli_wrapIcon" in:fade={{duration: 150}} out:fade={{duration:150}}>
                        <Loader height={"30px"} />
                    </div>
                {/if}

                <!-- if it is not the selected beat -->
            {:else}
                <div class="tli_wrapIcon" in:fade={{duration: 150}} out:fade={{duration:150}}>
                    <PlayIcon color={"#f7f7f7"}></PlayIcon>
                </div>
            {/if}
        </div>
    </div>

    <!-- all track minus art -->
    <div class="tli_allButArtContainer">
        <div class="tli_titleContainer">
            <p class="tli_title">{beat.beatTitle}</p>
            
            <div class="tli_keyReference">

                {#if beat.trackType === 'Reference'}
                    <p class="tli_reference">Reference</p>
                {:else if getDateAgeInDays(beat.createdAt) >= 29}
                    <div class="tli_dot"></div>
                {/if}

                {#if beat.futureDestinations.length >= 1}
                    <div class="tli_mobileDestinations">
                        <Destinations {beat}/>
                    </div>
                {/if}
           
    
                <p class="smallText">
                    {beat.key} {beat.mode} - {beat.bpm} BPM
                </p>
            </div>
                 
        </div>

        <div class="tli_tags">
            <BeatTagsSwiper beat={beat}/>
        </div>

        <div class="tli_destinations">
            <Destinations {beat}/>
        </div>

        <div class="tli_rating">
            {#each Array(beat.rating) as _}
                <div style="margin-right: 3px; width: fit-content">
                    <StarIcon color={'#f7f7f7'}/>
                </div>
            {/each}
        </div>


        <div class="tli_moreInfoContainer">

            <button class="moreIconButton" on:click={selectMoreBeat}>
                <MoreIcon color={"#f7f7f7"}/>
            </button>
        </div>


    </div>
</button>

<!-- modal for updating the notepad, future destinations and ratings. -->
{#if selectedMoreBeat}
    <Modal on:closeModal={resetSelectedMoreBeat} modalTitle={`More Details`}>
        <PopupBeat beat={selectedMoreBeat} />
    </Modal>
{/if}
