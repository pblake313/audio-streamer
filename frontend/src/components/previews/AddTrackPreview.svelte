<script lang="ts">
    import Logo from "../Icons/Logos/Logo.svelte";
    import SoundcloudLogo from "../Icons/Logos/SoundcloudLogo.svelte";
    import YoutubeLogo from "../Icons/Logos/YoutubeLogo.svelte";
    import BeatTag from "../misc/BeatTag.svelte";
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
    export let heading: string = "Enter `heading`";
    export let futureDestinations: string[] = [];
</script>

<div class="trackPreviewWrapper">
    {#if albumUrl}
        <img class="backgroundPreviewArt" src={albumUrl} alt="ALBUM ART" />
    {/if}

    <div class="insidePreview">
        <p><b>{heading}</b></p>
        <br />

        <div class="trackPreviewDetails">
            <div class="previewArtwork">
                {#if !albumUrl}
                    <p class="missingArt">No Artwork Uploaded</p>
                {:else}
                    <img class="previewAlbum" src={albumUrl} alt="ALBUM ART" />
                {/if}
            </div>

            <div class="trackInfoDetails">
                <p class="keyJoint">
                    {key ? key : "KEY"}
                    {mode ? mode : "MODE"} - {bpm ? bpm : "0"} BPM
                </p>

                <h3>{title ? title : "Track Title"}</h3>

                <div class="deskVersion">
                    <div class="previewTags">
                        {#if customTag || tagOne || tagTwo || mood}
                            {#if customTag}
                                <BeatTag
                                    tagText={customTag}
                                    tagColor={customTagColor
                                        ? `#${customTagColor}`
                                        : "#353535"}
                                    tagTextColor={customTag && customTagColor
                                        ? "#222222"
                                        : "#a8a8a8"}
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
                        {:else}
                            <br />
                        {/if}
                    </div>
                    {#if futureDestinations.length >= 1}
                        <div class="futureDestinations">
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
                                    <Logo width={"80px"} color={"#f7f7f7"}
                                    ></Logo>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <div class="mobileVers">
            <div class="previewTags">
                {#if customTag || tagOne || tagTwo || mood}
                    {#if customTag}
                        <BeatTag
                            tagText={customTag}
                            tagColor={customTagColor
                                ? `#${customTagColor}`
                                : "#353535"}
                            tagTextColor={customTag && customTagColor
                                ? "#222222"
                                : "#a8a8a8"}
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
                {:else}
                    <br />
                {/if}
            </div>
            {#if futureDestinations.length >= 1}
                <div class="futureDestinations">
                    {#if futureDestinations.includes("Youtube")}
                        <div class="wrapFDLogo">
                            <YoutubeLogo height={"20px"}></YoutubeLogo>
                        </div>
                    {/if}
                    {#if futureDestinations.includes("SoundCloud")}
                        <div class="wrapFDLogo">
                            <SoundcloudLogo height={"20px"}></SoundcloudLogo>
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
