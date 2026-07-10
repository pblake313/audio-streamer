<script lang="ts">
    import { fade } from "svelte/transition";
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
        
        <div class="loginPage_glass" >
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