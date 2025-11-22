<script lang="ts">
    import { fade } from "svelte/transition";
    import AudioLoader from "../AudioLoader.svelte";
    import HollowLoader from "../HollowLoader.svelte";
    import './FullPageLoader.css'

    export let loadingText: string | null = null
</script>


 
<div class="fullPageLoadWrap" out:fade={{duration: 500, delay: 500}}>

    <div class="insideFullLoad">

        <div class="tempBox">
            <HollowLoader></HollowLoader>
        </div>

        <div class="subAudioLoad">
            <AudioLoader height={'2px'} backgroundColor={'transparent'}></AudioLoader>
        </div>

        {#if loadingText}
            <div style="margin-top: 25px;">
                <p style="opacity: .3; font-size: 10pt;">{loadingText}</p>
            </div>
        {/if}
     

    </div>

</div>