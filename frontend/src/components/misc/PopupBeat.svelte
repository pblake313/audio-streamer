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
    import { formatTrackMeta, getDateAgeInDays, getUploadedAtString } from "../../helpers/formatters";
    import PencilIcon from "../Icons/svg/PencilIcon.svelte";
    import ReferenceBadge from "./ReferenceBadge.svelte";

    export let beat: Beat;

    $: beatToUse = $beats.find((oneBeat) => oneBeat.id === beat.id) ?? beat;
</script>

<div class="editBeatInfoBox">
    <div class="popupBeat_header">
        <div class="popupBeat_trackInfoFlex">
            <div class="popupBeat_artwork">
                <AlbumArtwork width="88px" radius="12px" imageUrl={beatToUse.artworkUrl} />
            </div>

            <div class="popupBeat_trackDetails">
                <div class="popupBeat_titleFlex">
                    <p class="popupBeat_trackTitle">{beatToUse.beatTitle}</p>
                    {#if beatToUse.trackType === "Reference"}
                        <ReferenceBadge />
                    {/if}
                </div>

                <div class="popupBeat_meta">
                    {#if formatTrackMeta(beatToUse)}
                        <span>{formatTrackMeta(beatToUse)}</span>
                        <span class="popupBeat_metaDot"></span>
                    {/if}
                    <span>{getUploadedAtString(beat.createdAt)}</span>
                </div>
            </div>
        </div>

        <div class="popupBeat_tags">
            <BeatTagsSwiper beat={beatToUse}/>
        </div>
    </div>

    <div in:fade={{ duration: 300 }}>
        <div class="popupBeat_controls">
            <div class="popupBeat_control">
                <p class="popupBeat_label">Destinations</p>
                <div class="popupBeat_controlBody">
                    <FutureDestinations beat={beatToUse} />
                </div>
            </div>

            <div class="popupBeat_control">
                <p class="popupBeat_label">Rating</p>
                <div class="popupBeat_controlBody">
                    <BeatRatingForm beat={beatToUse} />
                </div>
            </div>

            <div class="popupBeat_actions">
                <p class="popupBeat_label popupBeat_actionsLabel">Manage</p>
                <div class="popupBeat_actionIcons">
                    <a
                        class="popupBeat_editLink"
                        href="/portal/edit-beat/{beatToUse.id}"
                        aria-label="Edit track"
                        title="Edit track"
                    >
                        <PencilIcon height={"18px"} />
                    </a>
                    <MarkTrash beat={beatToUse}/>
                </div>
            </div>
        </div>

        {#if $popupError}
            <p class="popupBeat_error" in:fade={{ duration: 200 }}>{$popupError}</p>
        {/if}

        <NotePadForm
            beat={beatToUse}
        />
    </div>
</div>