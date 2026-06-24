<script lang="ts">
    import { fade } from "svelte/transition";
    import GlassSurface from "../../components/UI/GlassSurface.svelte";
    import PinForm from "../../forms/PinForm.svelte";
    import "./LoginPage.css";
    import { onMount } from "svelte";

        let showVideo = false;

    onMount(() => {
        showVideo = true;
    });
</script>

<div class="loginPage_container">
    <div class="loginPage_topFade"></div>
    <div class="loginPage_bottomFade"></div>

        
    {#if showVideo}
        
        <div class="loginPage_glass" in:fade={{duration: 500}}>
            <GlassSurface>
                <div class="loginPage_wrapForm">
                    <h2 style="margin-bottom: 25px;">Login</h2>
 
                    <PinForm />
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