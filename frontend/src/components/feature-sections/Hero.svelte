<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    import BoxButton from "../buttons/BoxButton.svelte";
    import GitHubLink from "../links/GitHubLink.svelte";
    import { user } from "../../stores/UserStore";
    import { rise } from "../../helpers/transitions";
    import { scrollToHash } from "../../helpers/scrollToHash";
    import "./Hero.css";

    let mounted = false;

    onMount(() => {
        mounted = true;
    });

</script>

<section class="hero">
    <!-- ambient light behind everything -->
    <div class="hero_backdrop" aria-hidden="true">
        <div class="hero_grid"></div>
        <div class="hero_orb hero_orb_a"></div>
        <div class="hero_orb hero_orb_b"></div>
    </div>

    {#if mounted}
        <div class="hero_inner">
            <a
                class="hero_eyebrow"
                href="/#summary"
                on:click|preventDefault={() => scrollToHash("/#summary")}
                in:rise={{ delay: 0, duration: 650, y: 14 }}
            >
                <span class="hero_eyebrowIcon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="5" y="11" width="14" height="9" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                </span>
                <span class="hero_eyebrowText">Private by default, never public</span>
                <svg class="hero_eyebrowArrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
            </a>

            <h1 class="hero_title">
                <span class="hero_titleLine" in:rise={{ delay: 60, duration: 650 }}>Your music,</span>
                <span class="hero_titleLine hero_titleAccent" in:rise={{ delay: 130, duration: 650 }}>locked in a vault.</span>
            </h1>

            <p class="hero_subtext" in:rise={{ delay: 220, duration: 650, y: 16 }}>
                Log in to stream your unreleased tracks and mixes from anywhere. Your files stay in private storage and only play through short-lived signed links.
            </p>

            <div class="hero_actions" in:rise={{ delay: 300, duration: 650, y: 14 }}>
                <div class="hero_primaryButton">
                    {#if $user}
                        <BoxButton on:click={() => goto("/portal")} buttonText={"Open your vault"} tightPad={true} fullWidth={true} />
                    {:else}
                        <BoxButton on:click={() => goto("/login")} buttonText={"Log in"} tightPad={true} fullWidth={true} />
                    {/if}
                </div>
                <!-- a plain text link under the button; hidden on phones -->
                <a
                    class="hero_howLink"
                    href="/#summary"
                    on:click|preventDefault={() => scrollToHash("/#summary")}
                >
                    How it works
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 5v14M6 13l6 6 6-6" />
                    </svg>
                </a>
            </div>

            <!-- pointers to the music tools -->
            <div class="hero_tools" in:rise={{ delay: 370, duration: 650, y: 16 }}>
                <a class="hero_tool" href="/chord-builder" style="--tool-rgb: 98, 214, 142">
                    <span class="hero_toolIcon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="16" rx="2" />
                            <path d="M9 4v16M15 4v16" />
                            <path d="M7.5 4v9h3V4M13.5 4v9h3V4" fill="currentColor" stroke="none" />
                        </svg>
                    </span>
                    <span class="hero_toolText">
                        <span class="hero_toolTitle">Chord Builder</span>
                        <span class="hero_toolSub">Sketch progressions in any key and export them as MIDI.</span>
                    </span>
                    <svg class="hero_toolArrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                </a>

                <a class="hero_tool" href="/theory" style="--tool-rgb: 255, 96, 128">
                    <span class="hero_toolIcon" aria-hidden="true">
                        <!-- circle of fifths -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 3v5M12 16v5M3 12h5M16 12h5" />
                        </svg>
                    </span>
                    <span class="hero_toolText">
                        <span class="hero_toolTitle">Theory</span>
                        <span class="hero_toolSub">Explore every key on an interactive circle of fifths.</span>
                    </span>
                    <svg class="hero_toolArrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                </a>
            </div>

            <div class="hero_githubLink" in:rise={{ delay: 440, duration: 650, y: 12 }}>
                <GitHubLink />
            </div>
        </div>
    {/if}
</section>
