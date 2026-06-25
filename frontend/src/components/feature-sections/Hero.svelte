<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    import BoxButton from "../buttons/BoxButton.svelte";
    import GitHubLink from "../links/GitHubLink.svelte";
    import "./Hero.css";
    import GlassSurface from "../UI/GlassSurface.svelte";
    import { user } from "../../stores/UserStore";

    let showVideo = false;

    onMount(() => {
        showVideo = true;
    });
</script>

<div class="hero_container">
    {#if showVideo}
        <div
            class="hero_insideContainer"
            in:fade={{ duration: 700, delay: 150 }}
        >
            <h1>Secure audio streaming for unreleased music.</h1>

            <p class="hero_subtext">
                A private SvelteKit and Node.js audio vault built for protected
                playback, token-secured streaming, and locked-down access to
                unreleased tracks.
            </p>

            <div class="hero_buttonContainer">
                {#if $user}
                    <BoxButton
                        on:click={() => {
                            goto("/portal");
                        }}
                        buttonText={"View Tracks"}
                        tightPad={true}
                        fullWidth={true}
                    />
                {:else}
                    <BoxButton
                        on:click={() => {
                            goto("/login");
                        }}
                        buttonText={"Login"}
                        tightPad={true}
                        fullWidth={true}
                    />
                {/if}
            </div>

<!-- performing rights organization -->
 <!-- bmi broadcasting music corp -->
  <!-- ascap -->

  <!-- mlc  -->
   <!-- mechanical licencesing collective? -->

   <!-- all rights reserved copyright () pattsway. -->

            <div class="hero_githubLink">
                <GitHubLink />
            </div>
        </div>
    {/if}

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
