<script lang="ts">
    import type { Beat } from "../../lib/types/Beats";
    import DeleteTrackForm from "../forms/DeleteTrackForm.svelte";
    import Logo from "../Icons/Logos/Logo.svelte";
    import SoundcloudLogo from "../Icons/Logos/SoundcloudLogo.svelte";
    import YoutubeLogo from "../Icons/Logos/YoutubeLogo.svelte";
    import BeatTag from "../misc/BeatTag.svelte";
    import AlbumArtwork from "../UI/AlbumArtwork.svelte";
    import "./AddTrackPreview.css";
    import { formatTrackMeta } from "../../helpers/formatters";

    export let deleteBeat: Beat | null = null

    export let title: string | null = null;
    export let bpm: number | null = null;
    export let tagOne: string | null = null;
    export let tagTwo: string | null = null;
    export let albumUrl: string | null = null;
    export let key: string | null = null;
    export let mode: string | null = null;
    export let mood: string | null = null;
    export let customTag: string | null = null;
    export let customTagColor: string | null = null;
    export let futureDestinations: string[] = [];
    // slim single-row version, e.g. pinned to the top of the add track page
    export let compact: boolean = false;
</script>

<div class="addTrackPreview_wrapper" class:addTrackPreview_compact={compact}>
    {#if albumUrl}
        <img
            class="addTrackPreview_backgroundImage"
            src={albumUrl}
            alt="ALBUM ART"
        />
    {/if}

    <div class="addTrackPreview_container">

        <div class="addTrackPreview_artwork">
            <AlbumArtwork width={'100%'} imageUrl={albumUrl} />
        </div>

        <div class="addTrackPreview_trackDetails">
            <p class="addTrackPreview_keyBpm">
                {formatTrackMeta({ key, mode, bpm }) || "Key · BPM"}
            </p>

            <h2 class="addTrackPreview_title">{title ? title : "Track Title"}</h2>

            <div class="addTrackPreview_tags">
                {#if customTag}
                    <BeatTag
                        tagText={customTag}
                        tagColor={customTagColor
                            ? `#${customTagColor}`
                            : "#353535"}
                        tagTextColor={customTag && customTagColor
                            ? "#222222"
                            : "#f7f7f7"}
                    ></BeatTag>
                {/if}
                {#if tagOne}
                    <BeatTag tagText={tagOne}></BeatTag>
                {/if}
                {#if tagTwo}
                    <BeatTag tagText={tagTwo}></BeatTag>
                {/if}
                {#if mood}
                    <BeatTag tagText={mood}></BeatTag>
                {/if}

            </div>

            {#if deleteBeat}
                <div class="addTrackPreview_wrapDeleteBeat">
                    <DeleteTrackForm beat={deleteBeat}/>
                </div>
            {/if}



            {#if futureDestinations.length >= 1}
                <div class="addTrackPreview_destinations">
                    {#if futureDestinations.includes("Youtube")}
                        <div class="wrapFDLogo">
                            <YoutubeLogo height={"20px"}></YoutubeLogo>
                        </div>
                    {/if}
                    {#if futureDestinations.includes("SoundCloud")}
                        <div class="wrapFDLogo">
                            <SoundcloudLogo height={"20px"}
                            ></SoundcloudLogo>
                        </div>
                    {/if}
                    {#if futureDestinations.includes("Pattsway")}
                        <div class="wrapFDLogo">
                            <Logo width={"80px"} color={"#f7f7f7"}></Logo>
                        </div>
                    {/if}
                </div>
            {/if}

        </div>
    </div>

    <div class="bottomFader"></div>
    <div class="topFader"></div>
</div>
