<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    import BoxButton from "../buttons/BoxButton.svelte";
    import GitHubLink from "../links/GitHubLink.svelte";
    import "./Hero.css";
    import GlassSurface from "../UI/GlassSurface.svelte";

    let showVideo = false;

    onMount(() => {
        showVideo = true;
    });
</script>

<div class="hero_container">

    <div class="hero_insideContainer">


        <h1>Secure audio streaming for unreleased music.</h1>

        <p class="hero_subtext">
            A private SvelteKit and Node.js audio vault built for protected
            playback, token-secured streaming, and locked-down access to unreleased
            tracks.
        </p>

        <div class="hero_buttonContainer">
            <BoxButton
                on:click={() => {
                    goto("/login");
                }}
                buttonText={"Login"}
                tightPad={true}
                fullWidth={true}
            />
        </div>

        <div class="hero_githubLink">
            <GitHubLink />
        </div>

    </div>

    <div class="hero_topFade"></div>
    <div class="hero_bottomFade"></div>


    {#if showVideo}
        <video
            class="hero_video"
            src="/Videos/lineglass.mp4"
            autoplay
            loop
            muted
            playsinline
            in:fade={{ duration: 1200, delay: 600 }}
        ></video>
    {/if}
</div>