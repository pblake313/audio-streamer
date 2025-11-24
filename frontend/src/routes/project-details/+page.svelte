<script lang="ts">
    import { goto } from "$app/navigation";
    import BoxButton from "../../components/buttons/BoxButton.svelte";
    import Toggler from "../../components/buttons/Toggler.svelte";
    import GitHubLink from "../../components/links/GitHubLink.svelte";
    import DesktopScreenshotSwiper from "../../components/swipers/DesktopScreenshotSwiper.svelte";
    import MobileScreenshotSwiper from "../../components/swipers/MobileScreenshotSwiper.svelte";
   
    export let slideType: 'mobile' | 'desktop' = 'desktop'

</script>



<svelte:head>
    <title>Audio Streamer - Project Details</title>
</svelte:head>


<style>
    .containProjectDetails{
        margin: auto;
    }
    h1 {
        font-size: 28pt;
    }
    h2 {
        font-size: 24pt;
        margin-bottom: 10px;
    }
    p {
        font-size: 12pt;
        opacity: .6;
    }
    .wrapProjectInfo{
        max-width: 1250px;
        padding: 0px 25px;
        margin: auto;
    }
    .wrapGit{
        width: fit-content;
        margin: auto;
        width: 100%;
        position: sticky;
        top: 0px;
        display: flex;
        justify-content: space-evenly;
        padding: 10px 0px;
        background-color: #222222;
        z-index: 5;

    }

    .wrapGotoLoginButton{
        width: 100%;
        max-width: 250px;
        margin: auto;
        margin-top: 50px;
        margin-bottom: 150px;

    }
    @media(max-width: 500px){
        h2 {
            font-size: 18pt;
        }
    }
    @media(max-width: 650px){
        .wrapGotoLoginButton{
            width: calc(100% - 30px);
            max-width: 100%;
            padding: 0px 15px;
        }
        .wrapProjectInfo{
            padding: 0px 15px;
        }
    }
</style>

<div class="containProjectDetails">
    <div class="wrapGit">
        <GitHubLink></GitHubLink>
    </div>


    <div class="wrapProjDeets">

        <h1 style="text-align: center;">Project Details</h1>
        <p style="text-align: center;"><em>audio-streamer</em></p>

        <div style="height: 75px;"></div>

                <!-- PROJECT SUMMARY -->
        <div class="wrapProjectInfo">
            <h2>Project Summary</h2>

            <p>
                A secure, token-gated audio streaming system built to protect unreleased music. All audio is streamed through a locked backend pipeline—no public URLs, no exposed storage, and no way for users to access or download the original files. Every request is IP-checked, token-signed, and fully validated.
                <br><br>
                The frontend never receives real file links, only a short-lived stream token used for controlled, chunked playback. Audio plays in real time but cannot be saved or cached, turning the app into a private listening vault.
                <br><br>
                Access is intentionally minimal: one PIN-locked user can unlock the library and preview tracks from anywhere without ever exposing the source files to the public.
            </p>

        </div>

        <div style="height: 50px;"></div>

        <div class="wrapProjectInfo">

            <div class="photosButtonsFlex">
                <div class="headingSide">
                    <h2>Project Photos</h2>
                </div>

                <Toggler value={slideType} onToggle={(v) => {slideType = v}}></Toggler>
            </div>
        </div>

        {#if slideType === 'desktop'}
            <DesktopScreenshotSwiper></DesktopScreenshotSwiper>
        {:else}
            <MobileScreenshotSwiper></MobileScreenshotSwiper>
        {/if}
            
        <div style="height: 50px;"></div>

        <div class="wrapProjectInfo">

            <h2>Purpose</h2>
            <p>
                This platform was built for music producers who need a safe way to review mixes and unreleased tracks without ever exposing the original audio files. It acts as a private streaming vault: the entire library lives in secure cloud storage, can be played from anywhere, and is never downloadable or directly accessible. A single, trusted user unlocks the app, keeping the catalog completely hidden from the public.
            </p>

            <br>

            <h2>Technologies</h2>
            <p>
                Built with a modern, security-focused stack:
                <br><br>
                <strong>Frontend:</strong> SvelteKit, custom audio player, reactive stores, secure fetch wrappers.<br>
                <strong>Backend:</strong> Node.js, Express, middleware-driven auth, range-based streaming.<br>
                <strong>Cloud:</strong> Firebase Admin SDK, Firebase Storage, token-secured stream endpoints.<br>
                <strong>Security:</strong> IP verification, PIN-gated access, JWT stream tokens, rate-limited login attempts.
            </p>

            <br>


            <!-- STREAMING -->
            <h2>Streaming</h2>
            <p>
                Audio is delivered through a controlled <strong>chunked HTTP streaming</strong> pipeline. The frontend receives only a short-lived, IP-bound stream token, which is passed to an Express endpoint that reads from Firebase Storage using range requests. The browser never sees a public file URL, and only ever buffers what it needs to play — not the full file — which prevents downloads, scraping, or direct access.
            </p>
            <br>

            <!-- AUTH -->
            <h2>Auth</h2>
            <p>
                Access is gated behind a <strong>PIN-based login</strong> combined with <strong>IP verification</strong>. The backend tracks failed attempts and can temporarily block abusive IPs, while successful logins receive short-lived tokens tied to the requesting client. All auth logic lives on the server, so even if someone inspects the network layer, they still can’t bypass the gate or reach the underlying audio files.
            </p>

            <br>

            <!-- FRONTEND -->
            <h2>Frontend</h2>
            <p>
                The frontend is built with <strong>SvelteKit</strong> and uses reactive stores, custom UI components, and a protected audio player that only ever talks to secured backend endpoints. It never handles raw storage URLs or loose blobs — every play action goes through the stream token flow. The project details view includes desktop and mobile screenshot swipers to showcase the experience across devices.
            </p>

            <br>

            <!-- BACKEND -->
            <h2>Backend</h2>
            <p>
                The backend runs on <strong>Node.js</strong> and <strong>Express</strong>, using Firebase Admin to read audio from cloud storage and serve it via secure, range-based streaming. Middleware handles IP normalization, token verification, PIN checks, and block logic before any stream is allowed. Every route that touches audio is locked behind this pipeline, ensuring that streaming is possible, but raw file access is not.
            </p>

        </div>



        <div class="wrapGotoLoginButton">
            <BoxButton buttonText={'Go To Login'} fullWidth={true} on:click={()=> {goto('/')}}></BoxButton>
        </div>

    </div>

</div>
