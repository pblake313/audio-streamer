<script lang="ts">
    import Logo from "../Icons/Logos/Logo.svelte";
    import SoundcloudLogo from "../Icons/Logos/SoundcloudLogo.svelte";
    import YoutubeLogo from "../Icons/Logos/YoutubeLogo.svelte";
    import BeatTag from "../misc/BeatTag.svelte";
    import AlbumArtwork from "../UI/AlbumArtwork.svelte";
    import "./AddTrackPreview.css";

    export let title: string | null = null;
    export let bpm: number | null;
    export let tagOne: string | null = null;
    export let tagTwo: string | null = null;
    export let albumUrl: string | null = null;
    export let key: string | null = null;
    export let mode: string | null = null;
    export let mood: string | null = null;
    export let customTag: string | null = null;
    export let customTagColor: string | null = null;
    export let futureDestinations: string[] = [];
</script>

<div class="addTrackPreview_wrapper">
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
                {key ? key : "KEY"}
                {mode ? mode : "MODE"} <span style="opacity: .3;">|</span> {bpm ? bpm : "0"} BPM
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
