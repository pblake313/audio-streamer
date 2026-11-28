<script lang="ts">
    import Toggler from "../buttons/Toggler.svelte";
    import DesktopScreenshotSwiper from "../swipers/DesktopScreenshotSwiper.svelte";
    import MobileScreenshotSwiper from "../swipers/MobileScreenshotSwiper.svelte";
    import FeaturePlans from "./FeaturePlans.svelte";
    import SwipeDots from "../UI/SwipeDots.svelte";
    import { reveal } from "../../helpers/transitions";
    import "./ProjectDetails.css";

    let slideType: "mobile" | "desktop" = "mobile";

    // the summary cards swipe sideways on small screens (CSS); SwipeDots follows them
    let pillarTrack: HTMLDivElement;
    const pillarLabels = ["Show Private storage", "Show One PIN, no accounts", "Show Made for reviewing mixes"];

    type Item = { title: string; text: string };

    // Technologies, drawn as the path a request takes (browser → server →
    // storage) with security wrapped around every step
    type TechIcon = "browser" | "server" | "cloud" | "shield" | "stream" | "key";

    type Layer = {
        title: string;
        where: string;
        text: string;
        tags: string[];
        icon: TechIcon;
    };

    const techLayers: Layer[] = [
        {
            title: "Frontend",
            where: "In your browser",
            text: "The app you use: the player, the track list and every screen.",
            tags: ["SvelteKit", "TypeScript", "Svelte stores", "Custom audio player", "Responsive UI", "Secure API calls"],
            icon: "browser",
        },
        {
            title: "Backend",
            where: "On the server",
            text: "A REST API that checks every request, takes uploads and converts audio.",
            tags: ["Node.js", "Express", "TypeScript", "REST APIs", "Auth middleware", "File uploads", "FFmpeg", "Socket.IO"],
            icon: "server",
        },
        {
            title: "Cloud",
            where: "Where the music lives",
            text: "Tracks and their details, stored privately and streamed by short-lived links.",
            tags: ["Firebase Firestore", "Firebase Storage", "Firebase Admin SDK", "Time-limited signed URLs"],
            icon: "cloud",
        },
    ];

    // the cards swipe sideways on small screens (CSS); SwipeDots follows them
    let techTrack: HTMLDivElement;

    const techSecurity: Layer = {
        title: "Security",
        where: "Around every step",
        text: "Nothing is returned until the request has been checked.",
        tags: ["PIN login", "IP verification", "JWT tokens", "Signed storage URLs", "Rate limiting", "HTTP-only cookies"],
        icon: "shield",
    };

    $: techLabels = [...techLayers, techSecurity].map((l) => `Show ${l.title}`);

    // small line icons for the layers (fixed markup, nothing user-supplied)
    const TECH_ICONS: Record<TechIcon, string> = {
        browser: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9h18"/><circle cx="6.5" cy="6.8" r=".6" fill="currentColor"/><circle cx="8.8" cy="6.8" r=".6" fill="currentColor"/>',
        server: '<rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/><path d="M8 7.5h.01M8 16.5h.01"/>',
        cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.6 9.6 4.5 4.5 0 0 0 7 18.5z"/>',
        shield: '<path d="M12 3.5l7 2.6v5.4c0 4.4-3 8.1-7 9-4-0.9-7-4.6-7-9V6.1z"/><path d="M9 12.2l2.1 2.1L15.2 10"/>',
        stream: '<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10"/>',
        key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/>',
    };
    const techIcon = (icon: TechIcon) =>
        `<span class="pd_techIcon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TECH_ICONS[icon]}</svg></span>`;

    // nine of each, so they fill a 3 x 3 grid
    const frontend: Item[] = [
        { title: "Architecture", text: "SvelteKit and TypeScript, with shared layouts and reusable components across every page." },
        { title: "Audio Player", text: "Custom controls, seeking, WAV and MP3 playback, waveforms, shuffle, loop, and a \"Still Listening?\" pause after 30 minutes." },
        { title: "Link Refresh", text: "Reads when each signed audio link expires and quietly swaps in a fresh one, so playback carries on without a reload." },
        { title: "A/B Testing", text: "Two synced players for switching instantly between your mix and a reference track." },
        { title: "Chord Builder", text: "A Web Audio synth with a look-ahead scheduler, a piano roll editor, harmonic function badges and MIDI import." },
        { title: "Theory", text: "An interactive circle of fifths with scales, chords and example progressions for all 24 keys." },
        { title: "State Management", text: "Svelte stores for playback, the selected track, filters, search, pagination and autoplay." },
        { title: "API Integration", text: "Separate public and authenticated fetch helpers, with token refresh, normalized errors and forced logout." },
        { title: "Responsive Design", text: "Adaptive navigation, mobile audio controls, and card rows that swipe on small screens." },
    ];

    const backend: Item[] = [
        { title: "Architecture", text: "Node.js, Express and TypeScript, with routes, controllers, middleware, validators and one central error handler." },
        { title: "Authentication", text: "PIN login with IP-bound JWTs: 30-second access tokens and 48-hour refresh tokens in secure HTTP-only cookies." },
        { title: "Middleware", text: "Checks the token, IP and session before any protected route runs, and renews access tokens as they expire." },
        { title: "Audio Delivery", text: "WAV and MP3 files stay private in Firebase Storage, streamed through one-hour V4 signed URLs." },
        { title: "Track Management", text: "Uploads, edits, ratings, notes, tags, release destinations, trash, search and filtered pagination." },
        { title: "File Handling", text: "WAV, MP3 and stem (ZIP) uploads, artwork converted to WebP, and single-file or download-all exports." },
        { title: "WAV to MP3 Converter", text: "FFmpeg converts WAVs to 320 kbps MP3s with live progress over Socket.IO. A cleanup worker deletes them after two weeks." },
        { title: "MIDI", text: "Builds MIDI files from chord progressions, and saves, renames and deletes progressions in your library." },
        { title: "Rate Limiting", text: "300 requests per 15 minutes overall, 35 failed logins per 15 minutes, and a 7-day IP block after five wrong PINs." },
    ];

    // the two groups swipe sideways on small screens (CSS); SwipeDots follows each
    const detailGroups = [
        { eyebrow: "Client", title: "Frontend", items: frontend },
        { eyebrow: "Server", title: "Backend", items: backend },
    ];
    let detailTracks: HTMLDivElement[] = [];

    // stagger cards in a grid, capped so long lists don't lag
    const stagger = (i: number) => Math.min(i, 5) * 70;
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

        <div class="pd_pillars" bind:this={pillarTrack}>
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

        <div class="pd_pillarDots">
            <SwipeDots track={pillarTrack} labels={pillarLabels} ariaLabel="Summary cards" />
        </div>
    </section>

    <!-- features: what's in the app vs. your own instance -->
    <FeaturePlans />

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

    <!-- tech -->
    <section class="pd_section" id="tech-stack">
        <div class="pd_heading" use:reveal>
            <p class="pd_eyebrow">Built with</p>
            <h2>Technologies</h2>
        </div>

        <!-- browser, server, storage: three across, with security below -->
        <div class="pd_techGrid" bind:this={techTrack}>
            {#each techLayers as layer, i}
                <div class="pd_techCell" use:reveal={{ delay: i * 110 }}>
                    <article class="pd_tech">
                        {@html techIcon(layer.icon)}
                        <p class="pd_techWhere">{layer.where}</p>
                        <h3 class="pd_techTitle">{layer.title}</h3>
                        <p class="pd_techText">{layer.text}</p>
                        <ul class="pd_techTags">
                            {#each layer.tags as tag}<li>{tag}</li>{/each}
                        </ul>
                    </article>
                </div>
            {/each}

            <!-- security wraps all three: full width under them on desktop -->
            <div class="pd_techCell pd_techBandCell" use:reveal={{ delay: 330 }}>
                <article class="pd_tech pd_techBand">
                    <div class="pd_techBandHead">
                        {@html techIcon(techSecurity.icon)}
                        <div>
                            <p class="pd_techWhere">{techSecurity.where}</p>
                            <h3 class="pd_techTitle">{techSecurity.title}</h3>
                            <p class="pd_techText">{techSecurity.text}</p>
                        </div>
                    </div>
                    <ul class="pd_techTags">
                        {#each techSecurity.tags as tag}<li>{tag}</li>{/each}
                    </ul>
                </article>
            </div>
        </div>

        <!-- which card is showing, while the row swipes -->
        <SwipeDots track={techTrack} labels={techLabels} ariaLabel="Technology cards" />
    </section>

    <!-- streaming + authentication -->
    <section class="pd_section pd_split" id="wheres-my-pin">
        <div use:reveal>
            <article class="pd_tech pd_panel">
                <div class="pd_panelHead">
                    {@html techIcon("stream")}
                    <div>
                        <p class="pd_techWhere">Delivery</p>
                        <h2 class="pd_panelTitle">Streaming</h2>
                    </div>
                </div>

                <p class="pd_panelText">
                    Tracks are stored privately in Firebase Storage, so the files have no public address.
                    Each time your tracks load, the player gets a signed link that stops working after an hour.
                </p>
            </article>
        </div>

        <div use:reveal={{ delay: 120 }}>
            <article class="pd_tech pd_panel">
                <div class="pd_panelHead">
                    {@html techIcon("key")}
                    <div>
                        <p class="pd_techWhere">Access</p>
                        <h2 class="pd_panelTitle">Authentication</h2>
                    </div>
                </div>

                <p class="pd_panelText">
                    Access is protected by a PIN that's checked on the server and tied to your IP address.
                    Sessions renew quietly in the background, and too many wrong PINs block that IP.
                </p>

                <div class="pd_callout">
                    <h3 class="pd_calloutTitle">Where's my PIN?</h3>
                    <p>This is a live demo, so the PIN isn't public. Get the source, set your own PIN and deploy your own copy.</p>
                    <a
                        class="pd_calloutButton"
                        href="https://github.com/pblake313/audio-streamer"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Get the source on GitHub
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M7 17L17 7M9 7h8v8" />
                        </svg>
                    </a>
                </div>
            </article>
        </div>
    </section>

    <!-- frontend / backend details -->
    {#each detailGroups as group, g}
        <section class="pd_section">
            <div class="pd_heading" use:reveal>
                <p class="pd_eyebrow">{group.eyebrow}</p>
                <h2>{group.title}</h2>
            </div>

            <!-- a 3 x 3 grid of cards; a swipeable row on small screens -->
            <div class="pd_details" bind:this={detailTracks[g]}>
                {#each group.items as item, i}
                    <div class="pd_detailCell" use:reveal={{ delay: stagger(i % 3) }}>
                        <article class="pd_tech pd_detail">
                            <span class="pd_detailIndex">{String(i + 1).padStart(2, "0")}</span>
                            <h3 class="pd_detailTitle">{item.title}</h3>
                            <p class="pd_detailText">{item.text}</p>
                        </article>
                    </div>
                {/each}
            </div>

            <SwipeDots
                track={detailTracks[g] ?? null}
                labels={group.items.map((item) => `Show ${item.title}`)}
                ariaLabel={`${group.title} cards`}
            />
        </section>
    {/each}
</div>
