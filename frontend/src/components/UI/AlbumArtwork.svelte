<script lang="ts">
    import WarningIcon from "../Icons/svg/WarningIcon.svelte";
    import "./AlbumArtwork.css";

    export let imageUrl: string | null = null;
    export let width: string = "150px";
    export let radius: string = "10px";

    let imageFailed = false;

    $: hasImage = !!imageUrl && !imageFailed;
</script>

<div
    class="albumArtwork_container"
    class:noImage={!hasImage}
    style="width: {width}; border-radius: {radius};"
>
    {#if hasImage}
        <img
            src={imageUrl}
            alt="album artwork"
            on:error={() => (imageFailed = true)}
        />
    {:else}
        <div class="albumArtwork_empty">
            <WarningIcon height={"18%"} color={"#868686"} />
            <p>No Image</p>
        </div>
    {/if}
</div>