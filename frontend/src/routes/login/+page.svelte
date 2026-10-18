<script lang="ts">
    import { fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { rise } from "../../helpers/transitions";
    import GlassSurface from "../../components/UI/GlassSurface.svelte";
    import "./LoginPage.css";
    import { onMount } from "svelte";
    import { user } from "../../stores/UserStore";
    import { goto } from "$app/navigation";
    import PinForm from "../../components/forms/PinForm.svelte";

    let showVideo = false;

    $: if ($user){
        goto('/portal')
    }

    onMount(() => {
        showVideo = true;
    });
</script>

<div class="loginPage_container">
    <div class="loginPage_topFade"></div>
    <div class="loginPage_bottomFade"></div>

    {#if showVideo}
        <div class="loginPage_glass" in:rise={{ delay: 250 }}>
            <GlassSurface>
                <div class="loginPage_wrapForm">
                    <div class="loginPage_badge" in:rise={{ delay: 550, duration: 700, y: 10, scale: 0.6, blur: 4 }}>
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect x="4" y="11" width="16" height="10" rx="2.5" />
                            <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                        </svg>
                    </div>

                    <h2 class="loginPage_title" in:rise={{ delay: 650, duration: 700, y: 12, scale: 1, blur: 6, easing: cubicOut }}>
                        Welcome back
                    </h2>

                    <p class="loginPage_subtitle" in:rise={{ delay: 750, duration: 700, y: 12, scale: 1, blur: 6, easing: cubicOut }}>
                        Enter your 6-digit access code
                    </p>

                    <div class="loginPage_form" in:rise={{ delay: 850, duration: 800, y: 14, scale: 1, blur: 6, easing: cubicOut }}>
                        <PinForm />
                    </div>
                </div>
            </GlassSurface>
        </div>
    {/if}

    {#if showVideo}
        <video
            class="loginPage_video"
            src="/Videos/goldlines.mp4"
            autoplay
            loop
            muted
            playsinline
            in:fade={{ duration: 1200, delay: 500 }}
        ></video>
    {/if}

</div>
