<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    import BoxButton from "../buttons/BoxButton.svelte";
    import GitHubLink from "../links/GitHubLink.svelte";
    import { user } from "../../stores/UserStore";
    import { rise } from "../../helpers/transitions";
    import "./Hero.css";

    let showVideo = false;

    onMount(() => {
        showVideo = true;
    });
</script>

<div class="hero_container">
    <!-- slow drifting glow behind the copy -->
    <div class="hero_glow" aria-hidden="true">
        <span class="hero_orb hero_orb_one"></span>
        <span class="hero_orb hero_orb_two"></span>
        <span class="hero_orb hero_orb_three"></span>
    </div>

    {#if showVideo}
        <div class="hero_insideContainer">
            <p class="hero_eyebrow" in:rise={{ delay: 100, y: 16 }}>
                <span class="hero_eyebrowDot"></span>
                Private audio library · Source on GitHub
            </p>

            <h1 class="hero_title">
                <span class="hero_titleLine" in:rise={{ delay: 220 }}>Your music.</span>
                <span class="hero_titleLine" in:rise={{ delay: 380 }}>
                    In one private workspace.
                </span>
            </h1>

            <p class="hero_subtext" in:rise={{ delay: 560, y: 18 }}>
                A secure music streaming platform that allows producers and musicians to organize, review, compare, and test their mixes from anywhere.
            </p>

            <div class="hero_buttonContainer" in:rise={{ delay: 720, y: 16 }}>
                <div class="hero_primaryButton">
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

                <a class="hero_secondaryButton" href="#summary">How it works</a>
            </div>

            <div class="hero_githubLink" in:rise={{ delay: 880, y: 12 }}>
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
