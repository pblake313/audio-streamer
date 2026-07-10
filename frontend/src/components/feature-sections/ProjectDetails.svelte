<script lang="ts">
    import { onMount } from "svelte";
    import Toggler from "../buttons/Toggler.svelte";
    import DesktopScreenshotSwiper from "../swipers/DesktopScreenshotSwiper.svelte";
    import MobileScreenshotSwiper from "../swipers/MobileScreenshotSwiper.svelte";
    import "./ProjectDetails.css";

    onMount(() => {
        if (window.innerWidth < 800) {
            slideType = "mobile";
        }
    });

    let slideType: "mobile" | "desktop" = "desktop";
</script>

<div class="projectDetails_container">
    <!-- PROJECT SUMMARY -->
    <div class="projectDetails_section">

        <h2>Project Summary</h2>

        <p>
            A secure, token-gated audio streaming system built to protect
            unreleased music. All audio is streamed through a locked backend
            pipeline—no public URLs, no exposed storage, and no way for users to
            access or download the original files. Every request is IP-checked,
            token-signed, and fully validated.
            <br /><br />
            The frontend never receives real file links, only a short-lived stream
            token used for controlled, chunked playback. Audio plays in real time
            but cannot be saved or cached, turning the app into a private listening
            vault.
            <br /><br />
            Access is intentionally minimal: one PIN-locked user can unlock the library
            and preview tracks from anywhere without ever exposing the source files
            to the public.
        </p>
    </div>

    <div class="projectDetails_photoFlex">
        <div class="headingSide">
            <h2>Project Photos</h2>
        </div>

        <Toggler
            value={slideType}
            onToggle={(v) => {
                slideType = v;
            }}
        />
    </div>

    <div class="projectDetails_swiperSection">
        {#if slideType === "desktop"}
            <DesktopScreenshotSwiper />
        {:else}
            <MobileScreenshotSwiper />
        {/if}
    </div>


    <div class="projectDetails_section">
        <h2>Purpose</h2>
        <p>
            This platform was built for music producers who need a safe way to
            review mixes and unreleased tracks without ever exposing the
            original audio files. It acts as a private streaming vault: the
            entire library lives in secure cloud storage, can be played from
            anywhere, and is never downloadable or directly accessible. A
            single, trusted user unlocks the app, keeping the catalog completely
            hidden from the public.
        </p>
    </div>
    <div class="projectDetails_section">
        <h2>Technologies</h2>
        <p>
            Built with a modern, security-focused stack:
            <br /><br />
            <strong>Frontend:</strong> SvelteKit, custom audio player, reactive
            stores, secure fetch wrappers.<br />
            <strong>Backend:</strong> Node.js, Express, middleware-driven auth,
            range-based streaming.<br />
            <strong>Cloud:</strong> Firebase Admin SDK, Firebase Storage,
            token-secured stream endpoints.<br />
            <strong>Security:</strong> IP verification, PIN-gated access, JWT stream
            tokens, rate-limited login attempts.
        </p>
    </div>
    <div class="projectDetails_section">
        <h2>Streaming</h2>
        <p>
            Audio is delivered through a controlled <strong
                >chunked HTTP streaming</strong
            > pipeline. The frontend receives only a short-lived, IP-bound stream
            token, which is passed to an Express endpoint that reads from Firebase
            Storage using range requests. The browser never sees a public file URL,
            and only ever buffers what it needs to play — not the full file — which
            prevents downloads, scraping, or direct access.
        </p>
    </div>
    <div class="projectDetails_section">
        <h2>Auth</h2>
        <p>
            Access is gated behind a <strong>PIN-based login</strong> combined
            with <strong>IP verification</strong>. The backend tracks failed
            attempts and can temporarily block abusive IPs, while successful
            logins receive short-lived tokens tied to the requesting client. All
            auth logic lives on the server, so even if someone inspects the
            network layer, they still can’t bypass the gate or reach the
            underlying audio files.
        </p>
    </div>
    <div class="projectDetails_section">
        <h2>Frontend</h2>
        <p>
            The frontend is built with <strong>SvelteKit</strong> and uses reactive
            stores, custom UI components, and a protected audio player that only
            ever talks to secured backend endpoints. It never handles raw storage
            URLs or loose blobs — every play action goes through the stream token
            flow. The project details view includes desktop and mobile screenshot
            swipers to showcase the experience across devices.
        </p>
    </div>
    <div class="projectDetails_section">
        <h2>Backend</h2>
        <p>
            The backend runs on <strong>Node.js</strong> and
            <strong>Express</strong>, using Firebase Admin to read audio from
            cloud storage and serve it via secure, range-based streaming.
            Middleware handles IP normalization, token verification, PIN checks,
            and block logic before any stream is allowed. Every route that
            touches audio is locked behind this pipeline, ensuring that
            streaming is possible, but raw file access is not.
        </p>
    </div>


</div>
