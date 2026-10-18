<script lang="ts">
    import Toggler from "../buttons/Toggler.svelte";
    import DesktopScreenshotSwiper from "../swipers/DesktopScreenshotSwiper.svelte";
    import MobileScreenshotSwiper from "../swipers/MobileScreenshotSwiper.svelte";
    import { reveal } from "../../helpers/transitions";
    import "./ProjectDetails.css";

    let slideType: "mobile" | "desktop" = "mobile";

    type Item = { title: string; text: string };

    const features: Item[] = [
        { title: "Audio Streaming", text: "Upload and securely stream your tracks from anywhere." },
        { title: "A/B Audio Testing", text: "Compare your track against another reference track in real time." },
        { title: "WAV to MP3 Converter", text: "Convert up to 20 WAV files (50 MB each) at a time into 320 kbps MP3s." },
        { title: "Track Filtering", text: "Filter tracks using custom tags, artist tags, moods, and track types." },
        { title: "Track Pagination", text: "Load tracks in paginated batches, with or without active filters." },
        { title: "Future Destinations", text: "Mark intended release destinations such as SoundCloud or YouTube." },
        { title: "Track Ratings", text: "Rate each track from 0 to 5 stars." },
        { title: "Track Notes", text: "Create and save custom notes for every track." },
    ];

    const technologies: Item[] = [
        { title: "Frontend", text: "SvelteKit, TypeScript, custom audio player, reactive stores, responsive UI, and secure API integration." },
        { title: "Backend", text: "Node.js, Express, TypeScript, REST APIs, middleware-driven authentication, file upload handling, FFmpeg, and Socket.IO." },
        { title: "Cloud", text: "Firebase Firestore, Firebase Storage, Firebase Admin SDK, and time-limited signed URLs for secure audio access." },
        { title: "Security", text: "PIN-based authentication, IP verification, JWT authentication, signed Firebase Storage URLs, rate limiting, and secure HTTP-only cookies." },
    ];

    const frontend: Item[] = [
        { title: "Architecture", text: "SvelteKit and TypeScript with reusable components, shared layouts, app-wide UI patterns, and responsive mobile and desktop behavior." },
        { title: "State Management", text: "Reactive Svelte stores for audio playback, selected tracks, loading states, filters, pagination, autoplay, navigation, and shared application data." },
        { title: "Audio Player", text: "Custom playback controls, seeking, buffering states, track navigation, autoplay behavior, waveform support, and secure streamed audio playback." },
        { title: "A/B Testing", text: "Reusable track, player, range, and toggle components for synchronized playback and instant switching between two tracks." },
        { title: "Reusable Components", text: "Shared buttons, modals, forms, navigation, track lists, artwork, filters, audio controls, and screenshot swipers used throughout the app." },
        { title: "API Integration", text: "Separate fetch helpers for public and authenticated requests, including token attachment, token refresh handling, normalized errors, and forced logout flows." },
        { title: "Responsive Design", text: "Adaptive navigation, mobile audio controls, swipeable content, responsive layouts, and device-specific interface behavior." },
    ];

    const backend: Item[] = [
        { title: "Architecture", text: "Node.js, Express, and TypeScript with organized controllers, middleware, helpers, validators, and REST API routes." },
        { title: "Authentication", text: "PIN-based login, IP-bound JWTs, 30-second access tokens, 48-hour refresh tokens in secure HTTP-only cookies, and automatic access token renewal." },
        { title: "Middleware", text: "Centralized request protection for token validation, IP normalization, session checks, error handling, and authorization before protected routes run." },
        { title: "Audio Delivery", text: "MP3s stay private in Firebase Storage. Track requests return one-hour V4 signed URLs, and the browser streams directly from Storage with them." },
        { title: "Track Management", text: "API endpoints for uploads, edits, deletion, ratings, notes, tags, future destinations, pagination, and filtered track retrieval." },
        { title: "File Handling", text: "Memory-based uploads, MP3 and image validation, artwork converted to optimized WebP, Firebase Storage uploads, and private MP3 storage." },
        { title: "WAV-to-MP3 Converter", text: "Converts uploaded WAV files to 320 kbps MP3s with FFmpeg, sending live progress to the browser over Socket.IO. Converted files are automatically removed from the database and cloud storage after two weeks." },
        { title: "Data Layer", text: "Firebase Admin SDK and Firestore queries for track data, authentication records, filtering, sorting, and paginated responses." },
        { title: "Error Handling", text: "Custom application errors, normalized API responses, session-expiration handling, force-logout flows, and centralized Express error middleware." },
        { title: "Rate Limiting", text: "Request throttling (300 requests per 15 minutes overall, 35 failed logins per 15 minutes) plus failed-PIN tracking that blocks an IP for seven days after five wrong PINs." },
    ];

    // stagger cards in a grid, capped so long lists don't lag
    const stagger = (i: number) => Math.min(i, 5) * 70;
    const pad = (i: number) => String(i + 1).padStart(2, "0");
</script>

<div class="pd_container">
    <!-- summary -->
    <section class="pd_section pd_summary" id="summary">
        <div class="pd_heading pd_summaryHead" use:reveal>
            <p class="pd_eyebrow">Overview</p>
            <h2>Summary</h2>
        </div>

        <p class="pd_lead pd_summaryLead" use:reveal={{ delay: 120 }}>
            This platform was built for music producers who need a secure way to
            review unreleased music and mixes without publicly exposing the
            original audio files. It acts as a private audio library where
            tracks are stored in Firebase Storage and can be accessed from
            anywhere by an authorized user.
        </p>

        <div class="pd_pillars">
            <div use:reveal={{ delay: 0 }}>
                <article class="pd_pillar">
                    <span class="pd_pillarIcon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="4" y="11" width="16" height="10" rx="2.5" />
                            <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                        </svg>
                    </span>
                    <h3 class="pd_pillarTitle">Private storage</h3>
                    <p class="pd_pillarText">
                        MP3 files are stored privately, so they can't be opened from a
                        permanent public link. The player streams them through signed
                        URLs that stop working after one hour.
                    </p>
                </article>
            </div>

            <div use:reveal={{ delay: 90 }}>
                <article class="pd_pillar">
                    <span class="pd_pillarIcon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="8" cy="15" r="4" />
                            <path d="M11 12l8-8" />
                            <path d="M16 7l2 2" />
                            <path d="M14 9l2 2" />
                        </svg>
                    </span>
                    <h3 class="pd_pillarTitle">One PIN, no accounts</h3>
                    <p class="pd_pillarText">
                        Access is intentionally minimal: a single PIN unlocks the
                        library, and the catalog stays hidden from the general public.
                    </p>
                </article>
            </div>

            <div use:reveal={{ delay: 180 }}>
                <article class="pd_pillar">
                    <span class="pd_pillarIcon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 12h2" />
                            <path d="M7 8v8" />
                            <path d="M11 5v14" />
                            <path d="M15 9v6" />
                            <path d="M19 7v10" />
                        </svg>
                    </span>
                    <h3 class="pd_pillarTitle">Made for reviewing mixes</h3>
                    <p class="pd_pillarText">
                        Browse, stream, and A | B compare mixes, then organize tracks
                        with tags, ratings, notes, and release destinations.
                    </p>
                </article>
            </div>
        </div>
    </section>

    <!-- photos swiper -->
    <section class="pd_photos" id="photos">
        <div class="pd_photoFlex" use:reveal>
            <div class="pd_heading">
                <p class="pd_eyebrow">Screens</p>
                <h2>Photos</h2>
            </div>

            <Toggler
                value={slideType}
                onToggle={(v) => {
                    slideType = v;
                }}
            />
        </div>

        <div class="pd_swiperSection" use:reveal={{ delay: 120, y: 32 }}>
            {#if slideType === "desktop"}
                <DesktopScreenshotSwiper />
            {:else}
                <MobileScreenshotSwiper />
            {/if}
        </div>
    </section>

    <!-- features -->
    <section class="pd_section" id="features">
        <div class="pd_heading" use:reveal>
            <p class="pd_eyebrow">What it does</p>
            <h2>Features</h2>
        </div>

        <div class="pd_grid">
            {#each features as item, i}
                <div use:reveal={{ delay: stagger(i) }}>
                    <article class="pd_card">
                        <span class="pd_cardIndex">{pad(i)}</span>
                        <h3 class="pd_cardTitle">{item.title}</h3>
                        <p class="pd_cardText">{item.text}</p>
                    </article>
                </div>
            {/each}
        </div>
    </section>

    <!-- tech -->
    <section class="pd_section" id="tech-stack">
        <div class="pd_heading" use:reveal>
            <p class="pd_eyebrow">Built with</p>
            <h2>Technologies</h2>
        </div>

        <div class="pd_grid pd_grid_wide">
            {#each technologies as item, i}
                <div use:reveal={{ delay: stagger(i) }}>
                    <article class="pd_card">
                        <h3 class="pd_cardTitle">{item.title}</h3>
                        <p class="pd_cardText">{item.text}</p>
                    </article>
                </div>
            {/each}
        </div>
    </section>

    <!-- streaming + authentication -->
    <section class="pd_section pd_split" id="wheres-my-pin">
        <div use:reveal>
            <article class="pd_panel">
                <p class="pd_eyebrow">Delivery</p>
                <h2 class="pd_panelTitle">Streaming</h2>
                <p>
                    MP3s are uploaded to <strong>Firebase Storage</strong> as private
                    objects, so their plain storage URLs can't be opened directly. Each
                    time an authenticated request loads tracks, the backend generates a
                    <strong>signed URL that expires after one hour</strong> for every MP3,
                    and the audio player streams straight from Firebase Storage with it.
                    The frontend only ever holds these temporary URLs; once one expires it
                    stops working, and loading the tracks again issues fresh ones. The
                    next and previous tracks are preloaded with small range requests so
                    skipping feels instant.
                </p>
            </article>
        </div>

        <div use:reveal={{ delay: 120 }}>
            <article class="pd_panel">
                <p class="pd_eyebrow">Access</p>
                <h2 class="pd_panelTitle">Authentication</h2>
                <p>
                    Access is protected by a <strong>PIN</strong> combined with
                    <strong>IP validation</strong>. Five wrong PINs from the same IP
                    block it for seven days, and login attempts are rate limited. A
                    correct PIN issues a <strong>30-second JWT access token</strong>
                    bound to the client's IP, plus a <strong>48-hour refresh token</strong>
                    in a secure HTTP-only cookie. Protected routes check that the IP
                    still matches and quietly issue new access tokens as they expire.
                    All of this runs on the server, so only an authenticated session can
                    load tracks or receive signed audio URLs.
                </p>

                <div class="pd_callout">
                    <h5 class="pd_calloutTitle">Where's My PIN?</h5>
                    <p>
                        This is a live deployment of the application, so the
                        <strong>PIN is not publicly available.</strong>
                        Since the source code is public on GitHub, you can
                        <a
                            class="pd_link"
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
            </article>
        </div>
    </section>

    <!-- frontend / backend details -->
    {#each [{ eyebrow: "Client", title: "Frontend", items: frontend }, { eyebrow: "Server", title: "Backend", items: backend }] as group}
        <section class="pd_section">
            <div class="pd_heading" use:reveal>
                <p class="pd_eyebrow">{group.eyebrow}</p>
                <h2>{group.title}</h2>
            </div>

            <div class="pd_list">
                {#each group.items as item, i}
                    <div class="pd_listItem" use:reveal={{ delay: stagger(i % 2), y: 16 }}>
                        <h3 class="pd_listTitle">{item.title}</h3>
                        <p class="pd_listText">{item.text}</p>
                    </div>
                {/each}
            </div>
        </section>
    {/each}
</div>
