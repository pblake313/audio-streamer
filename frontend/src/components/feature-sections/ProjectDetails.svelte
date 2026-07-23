<script lang="ts">
    import Toggler from "../buttons/Toggler.svelte";
    import DesktopScreenshotSwiper from "../swipers/DesktopScreenshotSwiper.svelte";
    import MobileScreenshotSwiper from "../swipers/MobileScreenshotSwiper.svelte";
    import "./ProjectDetails.css";

    let slideType: "mobile" | "desktop" = "mobile";
</script>

<div class="projectDetails_container">
    <!-- summary -->
    <div class="projectDetails_section" id="summary">
        <h2 class="projectDetails_header">Summary</h2>

        <p>
            This platform was built for music producers who need a secure way to
            review unreleased music and mixes without publicly exposing the
            original audio files. It acts as a private audio library where
            tracks are stored in Firebase Storage and can be accessed from
            anywhere by an authorized user.
            <br /><br />
            The frontend receives time-limited signed Firebase Storage URLs rather
            than permanent public file links. These signed URLs temporarily authorize
            access to each track and expire after a configured period, helping prevent
            the storage files from remaining openly accessible.
            <br /><br />
            Access is intentionally minimal. A single PIN-authenticated user can
            unlock the library, browse tracks, compare mixes, organize projects,
            and stream music while keeping the catalog hidden from the general public.
        </p>
    </div>

    <!-- photos swiper -->
    <div class="projectDetails_swiperMegaContainer" id="photos">
        <div class="projectDetails_photoFlex">
            <div class="headingSide">
                <h2>Photos</h2>
            </div>

            <Toggler
                value={slideType}
                onToggle={(v) => {
                    slideType = v;
                }}
            />
        </div>
    </div>

    <div class="projectDetails_swiperSection">
        {#if slideType === "desktop"}
            <DesktopScreenshotSwiper />
        {:else}
            <MobileScreenshotSwiper />
        {/if}
    </div>

    <!-- features -->
    <div class="projectDetails_section" id="features">
        <h2 class="projectDetails_header">Features</h2>
        <div class="projectDetails_featureList">
            <p>
                <span class="projectDetails_li_starter">Audio Streaming:</span> Upload
                and securely stream your tracks from anywhere.
            </p>
            <p>
                <span class="projectDetails_li_starter">A/B Audio Testing:</span
                > Compare your track against another reference track in real time.
            </p>
            <p>
                <span class="projectDetails_li_starter"
                    >WAV to MP3 Converter:</span
                > Convert WAV files to MP3 files.
            </p>
            <p>
                <span class="projectDetails_li_starter">Track Filtering:</span> Filter
                tracks using custom tags, artist tags, moods, and track types.
            </p>
            <p>
                <span class="projectDetails_li_starter">Track Pagination:</span>
                Load tracks in paginated batches, with or without active filters.
            </p>
            <p>
                <span class="projectDetails_li_starter"
                    >Future Destinations:</span
                > Mark intended release destinations such as SoundCloud or YouTube.
            </p>
            <p>
                <span class="projectDetails_li_starter">Track Ratings:</span> Rate
                each track from 0 to 5 stars.
            </p>
            <p>
                <span class="projectDetails_li_starter">Track Notes:</span> Create
                and save custom notes for every track.
            </p>
        </div>
    </div>

    <!-- tech -->
    <div class="projectDetails_section" id="tech-stack">
        <h2 class="projectDetails_header">Technologies</h2>

        <div class="projectDetails_featureList">
            <p>
                <span class="projectDetails_li_starter">Frontend:</span>
                SvelteKit, TypeScript, custom audio player, reactive stores, responsive
                UI, and secure API integration.
            </p>

            <p>
                <span class="projectDetails_li_starter">Backend:</span>
                Node.js, Express, TypeScript, REST APIs, middleware-driven authentication,
                and file upload handling.
            </p>

            <p>
                <span class="projectDetails_li_starter">Cloud:</span>
                Firebase Firestore, Firebase Storage, Firebase Admin SDK, and time-limited
                signed URLs for secure audio access.
            </p>

            <p>
                <span class="projectDetails_li_starter">Security:</span>
                PIN-based authentication, IP verification, JWT authentication, signed
                Firebase Storage URLs, rate limiting, and secure HTTP-only cookies.
            </p>
        </div>
    </div>

    <!-- streaming -->
    <div class="projectDetails_section">
        <h2 class="projectDetails_header">Streaming</h2>
        <p>
            Audio files are streamed directly from <strong
                >Firebase Storage</strong
            >
            using <strong>time-limited signed URLs</strong> generated by the backend.
            The frontend never stores permanent file links—instead, it requests a
            temporary URL each time playback begins. Once the URL expires, it can
            no longer be used, allowing audio to be streamed securely while keeping
            the underlying storage objects private and inaccessible to unauthorized
            users.
        </p>
    </div>

    <div class="projectDetails_section" id="wheres-my-pin">
        <h2 class="projectDetails_header">Authentication</h2>
        <p>
            Access is protected by a <strong>PIN-based authentication</strong>
            system combined with <strong>IP validation</strong>. The backend
            monitors failed login attempts, temporarily blocks abusive clients,
            and issues JWT access tokens alongside secure HTTP-only refresh
            cookies after successful authentication. All authentication logic is
            handled on the server, ensuring that only authorized users can
            access protected resources or request signed URLs for audio
            playback.
        </p>

        <h5 class="projectDetails_wmp">Where's My PIN?</h5>
        <p>
            This is a live deployment of the application, so the <span
                class="projectDetails_li_starter"
                >PIN is not publicly available.</span
            >
            Since the project is open source, you can
            <a
                class="projectDetails_li_starter"
                href="https://github.com/pblake313/audio-streamer"
                target="_blank"
                rel="noopener noreferrer"
            >
                download the source code from GitHub
            </a>, configure your own environment variables (including your PIN),
            and deploy your own instance. Every deployment uses its own PIN, so
            there isn't a shared PIN that grants access to this demo.
        </p>
    </div>

    <div class="projectDetails_section">
        <h2 class="projectDetails_header">Frontend</h2>
        <div class="projectDetails_featureList">
            <p>
                <span class="projectDetails_li_starter">Architecture:</span>
                SvelteKit and TypeScript with reusable components, shared layouts,
                app-wide UI patterns, and responsive mobile and desktop behavior.
            </p>

            <p>
                <span class="projectDetails_li_starter">State Management:</span>
                Reactive Svelte stores for audio playback, selected tracks, loading
                states, filters, pagination, autoplay, navigation, and shared application
                data.
            </p>

            <p>
                <span class="projectDetails_li_starter">Audio Player:</span>
                Custom playback controls, seeking, buffering states, track navigation,
                autoplay behavior, waveform support, and secure streamed audio playback.
            </p>

            <p>
                <span class="projectDetails_li_starter">A/B Testing:</span>
                Reusable track, player, range, and toggle components for synchronized
                playback and instant switching between two tracks.
            </p>

            <p>
                <span class="projectDetails_li_starter"
                    >Reusable Components:</span
                >
                Shared buttons, modals, forms, navigation, track lists, artwork,
                filters, audio controls, and screenshot swipers used throughout the
                app.
            </p>

            <p>
                <span class="projectDetails_li_starter">API Integration:</span>
                Separate fetch helpers for public and authenticated requests, including
                token attachment, token refresh handling, normalized errors, and
                forced logout flows.
            </p>

            <p>
                <span class="projectDetails_li_starter">Responsive Design:</span
                >
                Adaptive navigation, mobile audio controls, swipeable content, responsive
                layouts, and device-specific interface behavior.
            </p>
        </div>
    </div>
    <div class="projectDetails_section">
        <h2 class="projectDetails_header">Backend</h2>
        <div class="projectDetails_featureList">
            <p>
                <span class="projectDetails_li_starter">Architecture:</span>
                Node.js, Express, and TypeScript with organized controllers, middleware,
                helpers, validators, and REST API routes.
            </p>

            <p>
                <span class="projectDetails_li_starter">Authentication:</span>
                PIN-based login, IP verification, access and refresh tokens, secure
                HTTP-only cookies, and automatic access token renewal.
            </p>

            <p>
                <span class="projectDetails_li_starter">Middleware:</span>
                Centralized request protection for token validation, IP normalization,
                session checks, error handling, and authorization before protected
                routes run.
            </p>

            <p>
                <span class="projectDetails_li_starter">Audio Streaming:</span>
                Secure range-based streaming with short-lived tokens, partial-content
                responses, and no direct exposure of the original storage URLs.
            </p>

            <p>
                <span class="projectDetails_li_starter">Track Management:</span>
                API endpoints for uploads, edits, deletion, ratings, notes, tags,
                future destinations, pagination, and filtered track retrieval.
            </p>

            <p>
                <span class="projectDetails_li_starter">File Handling:</span>
                Memory-based uploads, image conversion and optimization, file validation,
                Firebase Storage uploads, and controlled media access.
            </p>
            <p>
                <span class="projectDetails_li_starter"
                    >WAV-to-MP3 Converter:</span
                >
                Converts uploaded WAV files into MP3 format with real-time conversion
                progress. Converted files are securely stored and automatically removed
                from the database and cloud storage after two weeks.
            </p>

            <p>
                <span class="projectDetails_li_starter">Data Layer:</span>
                Firebase Admin SDK and Firestore queries for track data, authentication
                records, filtering, sorting, and paginated responses.
            </p>

            <p>
                <span class="projectDetails_li_starter">Error Handling:</span>
                Custom application errors, normalized API responses, session-expiration
                handling, force-logout flows, and centralized Express error middleware.
            </p>
            <p>
                <span class="projectDetails_li_starter">Rate Limiting:</span>
                Request throttling and failed-login tracking to prevent brute-force
                PIN attempts, temporarily block abusive IP addresses, and protect
                authentication and API endpoints from excessive traffic.
            </p>
        </div>
    </div>
</div>
