<script lang="ts">
    import { fade } from "svelte/transition";
    import type { Beat } from "../../lib/types/Beats";
    import FutureDestinations from "../forms/FutureDestinations.svelte";
    import BeatRatingForm from "../forms/BeatRatingForm.svelte";
    import NotePadForm from "../forms/NotePadForm.svelte";
    import { popupError } from "../../stores/PopupBeatStore";
    import AlbumArtwork from "../UI/AlbumArtwork.svelte";
    import "./PopupBeat.css";
    import BeatTagsSwiper from "../standalone/BeatTagsSwiper.svelte";
    import { beats } from "../../stores/AudioPlayer/BeatsStore";
    import MarkTrash from "../forms/MarkTrash.svelte";

    export let beat: Beat;

    $: beatToUse = $beats.find((oneBeat) => oneBeat.id === beat.id) ?? beat;
</script>

<div class="editBeatInfoBox">
    <div class="popupBeat_trackInfoFlex">
        <AlbumArtwork width="90px" imageUrl={beatToUse.artworkUrl} />

        <div class="popupBeat_trackDetails">
            <p class="popupBeat_trackTitle">{beatToUse.beatTitle}</p>

            <p class="popupBeat_subtitle">
                {beatToUse.bpm} BPM - {beatToUse.key}
                {beatToUse.mode}
            </p>

            <BeatTagsSwiper beat={beatToUse} />
        </div>
    </div>

    <div in:fade={{ duration: 300 }}>
        <div class="popupBeat_clicksFlex">
            <FutureDestinations beat={beatToUse} />

            <div class="popupBeat_ratingAndTrash">
                <BeatRatingForm beat={beatToUse} />
                <MarkTrash beat={beatToUse}/>
            </div>
        </div>

        {#if $popupError}
            <p style="color: red; margin-top: 25px;">{$popupError}</p>
        {/if}

        <NotePadForm
            beat={beatToUse}
        />
    </div>
</div>