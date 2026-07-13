<script lang="ts">
    import "./TrackListItem.css";
    import SoundPlaying from "../../Icons/svg/SoundPlaying.svelte";
    import {
        selectedBeat,
        selectNewBeat,
    } from "../../../stores/AudioPlayer/selectedBeatStore";
    import {
    audioMode,
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
    import NotepadIcon from "../../Icons/svg/NotepadIcon.svelte";
    import { selectABTrack } from "../../../stores/ABTestStore";

    export let isEven: boolean = false;
    export let beat: Beat;
    export let selectedMoreBeat: Beat | null = null;

    export function selectTrack() {

        if ($audioMode === 'streamer'){
            const currentSelection = get(selectedBeat);

            if (currentSelection === beat) {
                if ($audioPlayerState === "Playing") {
                    pauseTrack();
                } else {
                    playTrack();
                }

                return;
            }

            useAutoPlay.set(true);
            selectNewBeat(beat);
        } else {
            selectABTrack(beat)
            scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth",
            });
        }

    }

    function handleRowKeydown(event: KeyboardEvent) {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        selectTrack();
    }

    function selectMoreBeat(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        selectedMoreBeat = beat;
    }

    function resetSelectedMoreBeat() {
        selectedMoreBeat = null;
    }
</script>

<div
    role="button"
    tabindex="0"
    class="tli_button"
    class:evenButton={isEven}
    on:click={selectTrack}
    on:keydown={handleRowKeydown}
>
    <!-- artwork -->
    <div class="tli_artworkContainer">
        <AlbumArtwork width={"100%"} imageUrl={beat.artworkUrl} />

        {#if $audioMode === 'streamer'}
            
            {#if $selectedBeat?.beatTitle === beat.beatTitle && $userTapped}
                <div
                    class="tli_playOverlay tli_selectedTrackOverlay"
                    class:hiderJ={["Paused", "Idle"].includes($audioPlayerState)}
                    class:goHide={$audioPlayerState === "Paused" ||
                        $audioPlayerState === "Idle"}
                >
                    {#if $audioPlayerState === "Playing"}
                        <div
                            class="tli_wrapIcon"
                            in:fade={{ duration: 150 }}
                            out:fade={{ duration: 150 }}
                        >
                            <SoundPlaying color={"#f7f7f7"} />
                        </div>
                    {/if}

                    {#if ["Buffering", "Loading"].includes($audioPlayerState)}
                        <div
                            class="tli_wrapIcon"
                            in:fade={{ duration: 150 }}
                            out:fade={{ duration: 150 }}
                        >
                            <Loader height={"30px"} />
                        </div>
                    {/if}
                </div>
            {/if}

            <div class="tli_playOverlay tli_playPauseOverlay">
                {#if $selectedBeat?.beatTitle === beat.beatTitle}
                    {#if ["Paused", "Idle"].includes($audioPlayerState)}
                        <div
                            class="tli_wrapIcon"
                            in:fade={{ duration: 150 }}
                            out:fade={{ duration: 150 }}
                        >
                            <PlayIcon color={"#f7f7f7"} />
                        </div>
                    {/if}

                    {#if ["Playing"].includes($audioPlayerState)}
                        <div
                            class="tli_wrapIcon"
                            in:fade={{ duration: 150 }}
                            out:fade={{ duration: 150 }}
                        >
                            <PauseIcon color={"#f7f7f7"} />
                        </div>
                    {/if}

                    {#if ["Loading", "Buffering"].includes($audioPlayerState)}
                        <div
                            class="tli_wrapIcon"
                            in:fade={{ duration: 150 }}
                            out:fade={{ duration: 150 }}
                        >
                            <Loader height={"30px"} />
                        </div>
                    {/if}
                {:else}
                    <div
                        class="tli_wrapIcon"
                        in:fade={{ duration: 150 }}
                        out:fade={{ duration: 150 }}
                    >
                        <PlayIcon color={"#f7f7f7"} />
                    </div>
                {/if}
            </div>
        {/if}

    </div>

    <!-- all track minus art -->
    <div class="tli_allButArtContainer">
        <div class="tli_titleContainer">
            <div class="tli_titleNotepadFlex">
                <p class="tli_title">{beat.beatTitle}</p>
                {#if beat.notepad}
                    <div class="tli_notepadContainer">
                        <NotepadIcon />
                    </div>
                {/if}
            </div>

            <div class="tli_keyReference">
        
                {#if getDateAgeInDays(beat.createdAt) >= 30 && beat.trackType === 'Beat'}
                    <div class="tli_dot"></div>
                {/if}

                {#if beat.futureDestinations.length >= 1}
                    <div class="tli_mobileDestinations">
                        <Destinations {beat} />
                    </div>
                {/if}

                <p class="smallText">
                    {beat.key} {beat.mode} - {beat.bpm} BPM
                </p>
                <div
                    class="tli_mobileTags"
                    on:click|stopPropagation
                    on:pointerdown|stopPropagation
                    on:pointermove|stopPropagation
                    on:pointerup|stopPropagation
                    on:pointercancel|stopPropagation
                >
                    <BeatTagsSwiper {beat} tagFontSize={'9pt'} tagPadding={'1px 0px'}/>
                </div>
            </div>
        </div>

        <div
            class="tli_tags"
            on:click|stopPropagation
            on:pointerdown|stopPropagation
            on:pointermove|stopPropagation
            on:pointerup|stopPropagation
            on:pointercancel|stopPropagation
        >
            <BeatTagsSwiper {beat} />
        </div>

        <div class="tli_destinations">
            <Destinations {beat} />
        </div>

        <div class="tli_rating">
            {#each Array(beat.rating) as _}
                <div style="margin-right: 3px; width: fit-content">
                    <StarIcon color={"#f7f7f7"} />
                </div>
            {/each}
        </div>

        <div class="tli_moreInfoContainer">
            <button
                type="button"
                class="moreIconButton"
                on:click={selectMoreBeat}
                on:pointerdown|stopPropagation
            >
                <MoreIcon color={"#f7f7f7"} />
            </button>
        </div>
    </div>
</div>

{#if selectedMoreBeat}
    <Modal on:closeModal={resetSelectedMoreBeat} modalTitle={`More Details`}>
        <PopupBeat beat={selectedMoreBeat} />
    </Modal>
{/if}