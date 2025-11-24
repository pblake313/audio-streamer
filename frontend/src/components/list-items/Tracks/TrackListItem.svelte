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
    import BeatRatingForm from "../../../forms/BeatRatingForm.svelte";
    import MoreIcon from "../../Icons/svg/MoreIcon.svelte";
    import StarIcon from "../../Icons/svg/StarIcon.svelte";
    import PauseIcon from "../../Icons/svg/PauseIcon.svelte";
    import NotepadIcon from "../../Icons/svg/NotepadIcon.svelte";
    import type { Beat } from "../../../lib/types/Beats";
    import NotePadForm from "../../../forms/NotePadForm.svelte";
    import { isUpdatingBeatFromModal } from "../../../stores/BeatUpdatingStore";
    import { fade } from "svelte/transition";
    import SpinLoader from "../../loaders/SpinLoader.svelte";
    import AudioLoader from "../../loaders/AudioLoader.svelte";
    import BeatTag from "../../misc/BeatTag.svelte";
    import Modal from "../../misc/Modal.svelte";
    import PlayIcon from "../../Icons/svg/PlayIcon.svelte";
    import Logo from "../../Icons/Logos/Logo.svelte";
    import YoutubeLogo from "../../Icons/Logos/YoutubeLogo.svelte";
    import SoundcloudLogo from "../../Icons/Logos/SoundcloudLogo.svelte";

    export let isEven: boolean = false;
    export let beat: Beat;
    export let selectedMoreBeat: Beat | null = null;
    let isUpdatingNotepad: boolean = false;

    let notepadValue: string = selectedMoreBeat?.notepad || "";
    let destinations: string[] = [];

    $: sortedDestinations = [...(beat.futureDestinations || [])].sort((a, b) =>
        a.localeCompare(b),
    );

    export function selectAndPlay() {
        const currentSelection = get(selectedBeat);

        if (currentSelection === beat && $audioPlayerState !== "Idle") {
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
    function getDaysAgo(uploadDate: {
        _seconds: number;
        _nanoseconds: number;
    }): string {
        // Validate input
        if (
            !uploadDate ||
            typeof uploadDate._seconds !== "number" ||
            isNaN(uploadDate._seconds)
        ) {
            return "-";
        }

        const uploaded = new Date(uploadDate._seconds * 1000);

        // Validate constructed date
        if (isNaN(uploaded.getTime())) {
            return "-";
        }

        const now = new Date();
        const diffInMs = now.getTime() - uploaded.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (isNaN(diffInDays)) return "-";

        if (diffInDays === 0) return "Uploaded Today";
        if (diffInDays === 1) return "Uploaded Yesterday";

        return `${diffInDays} Days Old`;
    }
</script>

<button
    type="button"
    class="trackButton"
    class:evenButton={isEven}
    on:click={selectAndPlay}
>
    <!-- artwork -->
    <div class="artworkWrapper">
        <img
            class="artworkImage"
            src={beat.artworkUrl}
            alt="pattsway | {beat.beatTitle}"
        />

        <!-- if its the selected beat -->
        {#if $selectedBeat?.beatTitle === beat.beatTitle && $userTapped}
            <div
                class="playingOverArt selTrackItem"
                class:hiderJ={["Paused", "Idle"].includes($audioPlayerState)}
                class:goHide={$audioPlayerState === "Paused" ||
                    $audioPlayerState === "Idle"}
            >
                <div class="wplay">
                    {#if $audioPlayerState === "Playing"}
                        <SoundPlaying color={"#f7f7f7"}></SoundPlaying>
                    {/if}

                    {#if ["Buffering", "Loading"].includes($audioPlayerState)}
                        <SpinLoader></SpinLoader>
                    {/if}
                </div>
            </div>
        {/if}

        <div class="playingOverArt ppoverlay">
            <div class="wplay">
                <!-- if its the selected beat -->
                {#if $selectedBeat?.beatTitle === beat.beatTitle}
                    {#if ["Paused", "Idle"].includes($audioPlayerState)}
                        <PlayIcon color={"#fff"}></PlayIcon>
                    {/if}
                    {#if ["Playing"].includes($audioPlayerState)}
                        <PauseIcon color={"#fff"}></PauseIcon>
                    {/if}

                    {#if ["Loading", "Buffering"].includes($audioPlayerState)}
                        <SpinLoader></SpinLoader>
                    {/if}

                    <!-- if it is not the selected beat -->
                {:else}
                    <PlayIcon color={"#fff"}></PlayIcon>
                {/if}
            </div>
        </div>
    </div>

    <!-- all track minus art -->
    <div class="allButArt">
        <div class="titleWrap">
            <p class="tjoint">
                {beat.beatTitle}
                <span class="mobileDays"> {getDaysAgo(beat.uploadDate)}</span>
            </p>
            <div class="flexDaysOld">
                <p class="smallText" style="margin-right: 8px;">
                    {getDaysAgo(beat.uploadDate)}
                </p>
                <div class="mobileDestinations">
                    <div class="destinationFlex">
                        {#if beat.notepad}
                            <div style="margin-right: 8px;  margin-top: 2px;">
                                <NotepadIcon></NotepadIcon>
                            </div>
                        {/if}

                        {#if beat.futureDestinations && beat.futureDestinations.length >= 1}
                            {#each sortedDestinations as destination}
                                {#if destination === "Pattsway"}
                                    <div style="margin-right: 9px; ">
                                        <Logo width={"60px"} color={"#f7f7f7"}
                                        ></Logo>
                                    </div>
                                {/if}
                                {#if destination === "Youtube"}
                                    <div
                                        style="margin-right: 9px; margin-top: 2px;"
                                    >
                                        <YoutubeLogo height={"20px"}
                                        ></YoutubeLogo>
                                    </div>
                                {/if}
                                {#if destination === "SoundCloud"}
                                    <div
                                        style="margin-right: 9px; margin-top: 2px;"
                                    >
                                        <SoundcloudLogo height={"20px"}
                                        ></SoundcloudLogo>
                                    </div>
                                {/if}
                            {/each}
                        {/if}
                    </div>
                </div>

                <div class="mobTagsFlex">
                    {#if beat.customTag}
                        <BeatTag
                            tagColor={`#${beat.customTagColor || 'f7f7f7'}` || "#353535"}
                            tagText={beat.customTag}
                            tagTextColor={"#222222"}
                        ></BeatTag>
                    {/if}
                    {#if beat.tagOne}
                        <BeatTag tagText={beat.tagOne}></BeatTag>
                    {/if}
                    {#if beat.tagTwo}
                        <BeatTag tagText={beat.tagTwo}></BeatTag>
                    {/if}
                </div>

                <div class="daysOldFader" class:evenfade={isEven}></div>
            </div>
        </div>

        <div class="futureDestinationsWrapper">
            <div class="destinationFlex">
                {#if beat.notepad}
                    <div style="margin-right: 8px;">
                        <NotepadIcon></NotepadIcon>
                    </div>
                {/if}

                {#if beat.futureDestinations && beat.futureDestinations.length >= 1}
                    {#each sortedDestinations as destination}
                        {#if destination === "Pattsway"}
                            <div style="margin-right: 9px;">
                                <Logo color={"#f7f7f7"}></Logo>
                            </div>
                        {/if}
                        {#if destination === "Youtube"}
                            <div style="margin-right: 9px;">
                                <YoutubeLogo height={"20px"}></YoutubeLogo>
                            </div>
                        {/if}
                        {#if destination === "SoundCloud"}
                            <div style="margin-right: 9px;">
                                <SoundcloudLogo height={"20px"}
                                ></SoundcloudLogo>
                            </div>
                        {/if}
                    {/each}
                {/if}
            </div>
        </div>

        <div class="taggerflexer">
            {#if beat.customTag}
                <BeatTag
                    tagColor={`#${beat.customTagColor || 'f7f7f7'}` || "#353535"}
                    tagText={beat.customTag}
                    tagTextColor={"#222222"}
                ></BeatTag>
            {/if}
            {#if beat.tagOne}
                <BeatTag tagText={beat.tagOne}></BeatTag>
            {/if}
            {#if beat.tagTwo}
                <BeatTag tagText={beat.tagTwo}></BeatTag>
            {/if}
            {#if beat.mood}
                <BeatTag tagText={beat.mood}></BeatTag>
            {/if}
        </div>

        <div class="wrapb">
            <p class="smallText">{beat.key} {beat.mode} - {beat.bpm} BPM</p>
        </div>

        <div class="moreInfoC">
            <div class="ratingJ">
                {#each Array(beat.rating) as _}
                    <div style="margin-right: 3px; width: fit-content">
                        <StarIcon></StarIcon>
                    </div>
                {/each}
            </div>
            <div class="wrappamo">
                <button class="moreIconButton" on:click={selectMoreBeat}
                    ><MoreIcon color={"#fff"}></MoreIcon></button
                >
            </div>
        </div>
    </div>
</button>

<!-- modal for updating the notepad, future destinations and ratings. -->
{#if selectedMoreBeat}
    <Modal on:closeModal={resetSelectedMoreBeat} modalTitle={`More Details`}>
        <div class="editBeatInfoBox">
            <div class="beatRatingFlex">
                <div class="containRatingJoint">
                    <button class="ratingArt">
                        <img
                            class="ratea"
                            src={beat.artworkUrl}
                            alt={beat.beatTitle}
                        />
                    </button>
                    <div>
                        <p>{beat.beatTitle}</p>
                        <p style="font-size: 8pt; opacity: .7;">
                            {beat.bpm} BPM - {beat.key}
                            {beat.mode}
                        </p>
                    </div>
                </div>
            </div>

            {#if $isUpdatingBeatFromModal}
                <div class="wrapNoteLoader" in:fade={{ duration: 300 }}>
                    <p
                        style="font-size: 9pt; opacity: .5; margin-bottom: 20px; text-align: center;"
                    >
                        Updating Beat
                    </p>
                    <div class="wl">
                        <AudioLoader backgroundColor={"transparent"}
                        ></AudioLoader>
                    </div>
                </div>
            {:else}
                <div in:fade={{ duration: 300 }}>
                    <BeatRatingForm
                        onRatingUpdated={resetSelectedMoreBeat}
                        beat={selectedMoreBeat}
                    ></BeatRatingForm>

                    <NotePadForm
                        onRatingUpdated={resetSelectedMoreBeat}
                        beat={selectedMoreBeat}
                    ></NotePadForm>
                </div>
            {/if}
        </div>
    </Modal>
{/if}
