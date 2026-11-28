<script lang="ts">
    import { reveal } from "../../helpers/transitions";
    import SwipeDots from "../UI/SwipeDots.svelte";
    import "./FeaturePlans.css";

    /*
        Features laid out like a pricing table: one card per part of the app.
        "included" rows work for anyone on this site. "instance" rows need a
        login, and since the PIN is private, that means deploying your own copy.
    */
    const repoUrl = "https://github.com/pblake313/audio-streamer";

    // below 1100px the cards become a row that swipes sideways (CSS);
    // SwipeDots follows it
    let track: HTMLDivElement;

    type Plan = {
        id: string;
        name: string;
        tagline: string;
        price: string;
        priceNote: string;
        accent: string; // r, g, b
        featured?: boolean;
        cta: { label: string; href: string; external?: boolean };
        secondary?: { label: string; href: string };
        included: string[];
        instance: string[];
    };

    const plans: Plan[] = [
        {
            id: "vault",
            name: "Vault",
            tagline: "Your private library for streaming and reviewing mixes.",
            price: "Self-hosted",
            priceNote: "Deploy your own instance with your own PIN",
            accent: "170, 120, 255",
            featured: true,
            cta: { label: "Get the source on GitHub", href: repoUrl, external: true },
            secondary: { label: "Already have the PIN? Log in", href: "/login" },
            included: [],
            instance: [
                "Stream .wav or .mp3 files",
                "A | B audio tester",
                ".wav to .mp3 converter",
                "Stem uploads and downloads",
                "Search, sort and filters",
                "Ratings, notes and tags",
                "PIN login and signed links",
            ],
        },
        {
            id: "chord-builder",
            name: "Chord Builder",
            tagline: "Sketch progressions in any key and take them into your DAW.",
            price: "Free",
            priceNote: "Open to everyone, no login needed",
            accent: "98, 214, 142",
            cta: { label: "Open Chord Builder", href: "/chord-builder" },
            included: [
                "Progression shuffler",
                "Piano roll editor",
                "Harmonic function badges",
                "Instrument sounds and metronome",
            ],
            instance: [
                "Artist-inspired progressions",
                "MIDI import and library",
                "MIDI export",
            ],
        },
        {
            id: "theory",
            name: "Theory",
            tagline: "An interactive circle of fifths for learning every key.",
            price: "Free",
            priceNote: "Open to everyone, no login needed",
            accent: "255, 96, 128",
            cta: { label: "Open Theory", href: "/theory" },
            included: [
                "Interactive circle of fifths",
                "Key signatures and Camelot codes",
                "Scale notes and intervals",
                "Chords in every key",
                "Example progressions",
            ],
            instance: [],
        },
    ];
</script>

<section class="pd_section" id="features">
    <div class="fp_head" use:reveal>
        <div class="pd_heading">
            <p class="pd_eyebrow">What's included</p>
            <h2>Features</h2>
        </div>

        <p class="fp_intro">
            Chord Builder and Theory are free to use right here. The vault is private, so to use it you deploy your own copy from GitHub with your own PIN.
        </p>
    </div>

    <!-- legend -->
    <ul class="fp_legend" use:reveal={{ delay: 80 }}>
        <li>
            <span class="fp_mark fp_mark_included" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            Included in the app
        </li>
        <li>
            <span class="fp_mark fp_mark_instance" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            </span>
            Needs your own instance
        </li>
    </ul>

    <div class="fp_plans" bind:this={track}>
        {#each plans as plan, i}
            <div use:reveal={{ delay: i * 90 }}>
                <article class="fp_plan" class:fp_planFeatured={plan.featured} style="--fp-accent: {plan.accent}">
                    {#if plan.featured}
                        <span class="fp_ribbon">The main app</span>
                    {/if}

                    <h3 class="fp_name">{plan.name}</h3>
                    <p class="fp_tagline">{plan.tagline}</p>

                    <div class="fp_price">
                        <span class="fp_priceValue">{plan.price}</span>
                        <span class="fp_priceNote">{plan.priceNote}</span>
                    </div>

                    <a
                        class="fp_cta"
                        href={plan.cta.href}
                        target={plan.cta.external ? "_blank" : undefined}
                        rel={plan.cta.external ? "noopener noreferrer" : undefined}
                    >
                        {plan.cta.label}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            {#if plan.cta.external}
                                <path d="M7 17L17 7M9 7h8v8" />
                            {:else}
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            {/if}
                        </svg>
                    </a>
                    {#if plan.secondary}
                        <a class="fp_secondary" href={plan.secondary.href}>{plan.secondary.label}</a>
                    {/if}

                    {#if plan.included.length}
                        <p class="fp_groupLabel">Included in the app</p>
                        <ul class="fp_list">
                            {#each plan.included as feature}
                                <li>
                                    <span class="fp_mark fp_mark_included" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                                    </span>
                                    <span><span class="fp_srOnly">Included: </span>{feature}</span>
                                </li>
                            {/each}
                        </ul>
                    {/if}

                    {#if plan.instance.length}
                        <p class="fp_groupLabel">With your own instance</p>
                        <ul class="fp_list">
                            {#each plan.instance as feature}
                                <li>
                                    <span class="fp_mark fp_mark_instance" aria-hidden="true">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                                    </span>
                                    <span><span class="fp_srOnly">Needs your own instance: </span>{feature}</span>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </article>
            </div>
        {/each}
    </div>

    <!-- which card is showing, while the row swipes -->
    <SwipeDots {track} labels={plans.map((p) => `Show ${p.name}`)} ariaLabel="Feature cards" />
</section>
