<script lang="ts">
    import { reveal } from "../../helpers/transitions";
    import "./ToolShowcase.css";

    // the music tools, shown on the home page. Shares section, eyebrow and
    // lead styles with ProjectDetails. `only` picks one tool, so the two
    // can sit in different places on the page.
    export let only: "chord-builder" | "theory" | null = null;

    type Tool = {
        id: string;
        eyebrow: string;
        title: string;
        lead: string;
        points: string[];
        href: string;
        cta: string;
        image: string;
        imageAlt: string;
        imageWidth: number;
        imageHeight: number;
        accent: string; // r, g, b
        flip?: boolean; // picture on the left
    };

    const tools: Tool[] = [
        {
            id: "chord-builder",
            eyebrow: "Write",
            title: "Chord Builder",
            lead: "Sketch a progression in any key, hear it right away, and take it straight into your DAW as MIDI.",
            points: [
                "Shuffle new chords in any key and scale, or start from a progression inspired by an artist.",
                "Edit every chord in a piano roll, with tonic, predominant and dominant badges as you go.",
                "Choose from a range of instrument sounds, set the tempo and turn on a metronome.",
                "Import and export MIDI, and save progressions to your library when you're logged in.",
            ],
            href: "/chord-builder",
            cta: "Open Chord Builder",
            image: "/Images/Features/chord-builder-preview.webp",
            imageAlt: "The Chord Builder: four chords, C, G, Am and F, above a piano roll of their notes",
            imageWidth: 1240,
            imageHeight: 820,
            accent: "98, 214, 142",
        },
        {
            id: "theory",
            eyebrow: "Learn",
            title: "Theory",
            lead: "An interactive circle of fifths. Pick any key to see how it's built, then hear it.",
            points: [
                "Key signatures, Camelot codes and related keys for every major and minor key.",
                "Every scale note with its interval, plus the whole and half steps between them.",
                "The chords in each key, from triads to 13ths, drawn on a piano roll you can play.",
                "Eight four-bar progressions per key, with a playhead that follows along.",
            ],
            href: "/theory",
            cta: "Open Theory",
            image: "/Images/Features/theory-preview.webp",
            imageAlt: "A colorful circle of fifths with C major selected",
            imageWidth: 820,
            imageHeight: 820,
            accent: "255, 96, 128",
            flip: true,
        },
    ];
</script>

{#each tools.filter((t) => !only || t.id === only) as tool (tool.id)}
    <section
        class="pd_section ts_section"
        class:ts_flip={tool.flip}
        id={tool.id}
        style="--ts-accent: {tool.accent}"
    >
        <div class="ts_text" use:reveal>
            <p class="pd_eyebrow">{tool.eyebrow}</p>
            <h2>{tool.title}</h2>
            <p class="pd_lead ts_lead">{tool.lead}</p>

            <ul class="ts_points">
                {#each tool.points as point}
                    <li class="ts_point">{point}</li>
                {/each}
            </ul>

            <a class="ts_cta" href={tool.href}>
                {tool.cta}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
            </a>
        </div>

        <a class="ts_visual" href={tool.href} tabindex="-1" aria-hidden="true" use:reveal={{ delay: 120, y: 32 }}>
            <img
                src={tool.image}
                alt={tool.imageAlt}
                width={tool.imageWidth}
                height={tool.imageHeight}
                loading="lazy"
                decoding="async"
            />
        </a>
    </section>
{/each}
