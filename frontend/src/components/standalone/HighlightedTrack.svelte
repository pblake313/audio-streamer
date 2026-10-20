<script lang="ts">
    import { fade } from "svelte/transition";
    import "./HighlightedTrack.css";
    import { formatTrackMeta } from "../../helpers/formatters";
    import { selectedBeat } from "../../stores/AudioPlayer/selectedBeatStore";
    import {
        audioPlayerState,
        audioStore,
        pauseTrack,
        playTrack,
        resetTrackTimer,
        setAudioFormat,
        userTapped,
    } from "../../stores/AudioPlayerStore";
    import {
        getAvailableFormats,
        getBeatAudioSource,
        preferredAudioFormat,
    } from "../../stores/AudioFormatStore";
    import AudioRange from "../misc/AudioRange.svelte";
    import AudioControlBox from "./AudioPlayerControls.svelte";
    import AlbumArtwork from "../UI/AlbumArtwork.svelte";
    import { swapIn, swapOut } from "../../helpers/transitions";
    import AudioPlayerState from "./AudioPlayerState.svelte";
    import PlayPauseButton from "../buttons/music/PlayPauseButton.svelte";
    import BeatTagsSwiper from "./BeatTagsSwiper.svelte";
    import PencilIcon from "../Icons/svg/PencilIcon.svelte";
    import MoreIcon from "../Icons/svg/MoreIcon.svelte";
    import Modal from "../misc/Modal.svelte";
    import PopupBeat from "../misc/PopupBeat.svelte";
    import type { Beat } from "../../lib/types/Beats";
    import AudioFormatToggle from "../buttons/music/AudioFormatToggle.svelte";

    // which file is playing (WAV / MP3) and which ones the track has
    $: availableFormats = getAvailableFormats($selectedBeat);
    $: playingFormat = getBeatAudioSource($selectedBeat, $preferredAudioFormat)?.format ?? null;

    /*
        Stacked (mobile) layout: crossfade in place on track change
        instead of drifting vertically. Checked when each transition
        starts, so it follows the current window size.
    */
    const isStacked = () =>
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 850px)").matches;

    let moreBeat: Beat | null = null;

    // controls the icon ONLY
    let playOrPauseIcon: "play" | "pause" = "play";

    // when NOT loading, sync icon to player state
    $: if (
        $audioPlayerState !== "Loading" &&
        $audioPlayerState !== "Buffering"
    ) {
        playOrPauseIcon = $audioPlayerState === "Playing" ? "pause" : "play";
    }

    function handlePlayPauseClick() {
        resetTrackTimer();

        if ($audioPlayerState === "Playing") {
            // Normal pause
            pauseTrack();
        } else {
            // First intentional tap: mark as user gesture
            if (!$userTapped) {
                userTapped.set(true);
            }

            // Now actually try to play
            playTrack();
        }
    }

    function handleArtworkClick() {
        // Same behavior as the main play/pause button
        handlePlayPauseClick();
    }
</script>

{#if $selectedBeat}
    <div class="ht_wrapper">
        <div class="ht_topFade"></div>
        <div class="ht_bottomFade"></div>

        {#key $selectedBeat.id}
            <img
                in:fade={{ duration: 900 }}
                out:fade={{ duration: 900 }}
                class="ht_background"
                src={$selectedBeat.artworkUrl}
                alt={$selectedBeat.beatTitle}
            />
        {/key}

        <div class="ht_insideContainer">
            <div class="ht_artworkContainer">
                <!-- ARTWORK CLICK = user gesture play/pause -->

                <button class="ht_artworkButton" on:click={handleArtworkClick}>
                    <div class="swapStack">
                        {#key $selectedBeat.id}
                            <div
                                in:fade={{ duration: 500, delay: 80 }}
                                out:fade={{ duration: 350 }}
                            >
                                <AlbumArtwork
                                    width={"100%"}
                                    imageUrl={$selectedBeat.artworkUrl}
                                />
                            </div>
                        {/key}
                    </div>

                    <!-- do not show on touch devices. -->
                    <div class="ht_albumOverlay">
                        <div class="ht_largePP">
                            <PlayPauseButton
                                height={"85px"}
                                playIconHeight={"50px"}
                                pauseIconHeight={"55px"}
                                playOrPause={playOrPauseIcon}
                                color={"#f7f7f7"}
                            />
                        </div>
                    </div>
                </button>
            </div>

            <div class="ht_trackInfo">
                <div class="ht_details">
                    <div class="ht_topRow">
                        <div class="ht_stateAndKey">
                            <AudioPlayerState />

                            <div class="swapStack ht_keyAndMode">
                                {#key $selectedBeat.id}
                                    <p
                                        in:swapIn={{ y: isStacked() ? 0 : 10 }}
                                        out:swapOut={{ y: isStacked() ? 0 : -6 }}
                                    >
                                        {formatTrackMeta($selectedBeat)}
                                    </p>
                                {/key}
                            </div>
                        </div>

                        <div class="ht_actions">
                            <!-- which file is playing (WAV / MP3), with a switch when there are both -->
                            <AudioFormatToggle
                                available={availableFormats}
                                active={playingFormat}
                                onSelect={setAudioFormat}
                            />

                            <a
                                class="ht_actionButton ht_editButton"
                                href="/portal/edit-beat/{$selectedBeat.id}"
                                aria-label="Edit track"
                                title="Edit track"
                            >
                                <PencilIcon height={"16px"} />
                            </a>

                            <button
                                type="button"
                                class="ht_actionButton"
                                aria-label="More details"
                                title="More details"
                                on:click={() => (moreBeat = $selectedBeat)}
                            >
                                <span class="ht_moreIcon">
                                    <MoreIcon height={"20px"} color={"#f7f7f7"} />
                                </span>
                            </button>
                        </div>
                    </div>

                    <div class="swapStack">
                        {#key $selectedBeat.id}
                            <div
                                class="ht_titleTags"
                                in:swapIn={{ y: isStacked() ? 0 : 10 }}
                                out:swapOut={{ y: isStacked() ? 0 : -6 }}
                            >
                                <h2 class="ht_title">{$selectedBeat.beatTitle}</h2>

                                <div class="ht_tags">
                                    <BeatTagsSwiper beat={$selectedBeat} />
                                </div>
                            </div>
                        {/key}
                    </div>
                </div>

                <div class="ht_rangeControls">

                    <div class="ht_mobileRange">
                        <AudioRange
                            audio={$audioStore ?? undefined}
                            useWaveForm={false}
                            
                        />
                    </div>

                    <AudioControlBox {playOrPauseIcon}></AudioControlBox>

                    <div class="ht_deskRange">
                        <AudioRange
                            waveHeight={50}
                            useWaveForm={true}
                            audio={$audioStore ?? undefined}
                        />
                    </div>

           
                </div>
            </div>
        </div>
    </div>
{/if}

{#if moreBeat}
    <Modal on:closeModal={() => (moreBeat = null)} modalTitle={`More Details`}>
        <PopupBeat beat={moreBeat} />
    </Modal>
{/if}
