<script lang="ts">
    import "../../TheoryPage.css";

    import { onDestroy, onMount, tick } from "svelte";
    import { page } from "$app/stores";
    import { replaceState } from "$app/navigation";
    import Footer from "../../../../components/standalone/Nav/Footer.svelte";
    import Seo from "../../../../components/misc/Seo.svelte";
    import CircleOfFifths from "../../../../components/Theory/CircleOfFifths.svelte";
    import KeyDetails from "../../../../components/Theory/KeyDetails.svelte";
    import { ChordLooper } from "../../../../helpers/ChordBuilder/ChordLooper";
    import type { KeyRef } from "../../../../helpers/Theory/keys";
    import type { ScaleKind } from "../../../../helpers/Theory/scales";
    import { theorySeo } from "../../../../helpers/Theory/seo";
    import { sameKey } from "../../../../helpers/Theory/urls";
    import type { PageData } from "./$types";

    /*
        Every key and scale is its own page (see +page.ts), so any view can be
        linked to, bookmarked or found in search:

            /theory/d-minor/blues?position=2#scales

        /theory/<key>        any key; other spellings redirect to the canonical one
        /<scale>             the Scales section: pentatonic, blues, dorian,
                             harmonic-minor, mixolydian, lydian
        ?position=2          1-based box on that scale's neck
        #section             key, scale, chords, progressions, guitar or scales;
                             scrolled to on load. ?section=... works too.

        Picking a key or scale here doesn't reload: the address bar just follows
        along. Following a real link (back/forward, a new tab, a shared URL) loads new
        `data`, and the page adopts it.
    */
    export let data: PageData;

    let selected: KeyRef = data.key;
    let moreKind: ScaleKind = data.scale ?? "pentatonic";
    let morePosition: number | null = readPosition($page.url);

    function readPosition(url: URL) {
        const n = Number(url.searchParams.get("position"));
        return Number.isInteger(n) && n >= 1 ? n - 1 : null;
    }

    // a navigation to another key or scale page brings new data
    let adopted = data;
    $: if (data !== adopted) {
        adopted = data;
        selected = data.key;
        moreKind = data.scale ?? "pentatonic";
        morePosition = readPosition($page.url);
    }

    // only used to audition chords and notes; created in the browser
    let looper: ChordLooper | null = null;
    onDestroy(() => looper?.destroy());

    const select = (key: KeyRef) => (selected = key);

    /*
        Which page the current view is. The scale only goes in the path once it
        isn't the default pentatonic, unless this page was loaded as the
        pentatonic page (/d-minor/pentatonic) and is still on that key.
    */
    $: scaleInPath =
        moreKind !== "pentatonic" || (data.scale === "pentatonic" && sameKey(selected, data.key))
            ? moreKind
            : null;
    $: seo = theorySeo(selected, scaleInPath);

    // keep the address bar on the canonical page for what's showing
    let ready = false;
    $: if (ready) syncUrl(seo.path, morePosition);

    function syncUrl(path: string, position: number | null) {
        const url = new URL(window.location.href);
        url.pathname = path;
        if (position === null) url.searchParams.delete("position");
        else url.searchParams.set("position", String(position + 1));
        url.searchParams.delete("section"); // only says where to scroll on load
        if (url.href !== window.location.href) replaceState(url, $page.state);
    }

    onMount(async () => {
        looper = new ChordLooper();

        // ?section= is an alias for the #hash
        const section = $page.url.searchParams.get("section");
        const target = section ?? decodeURIComponent(window.location.hash.slice(1));
        if (section) {
            const url = new URL(window.location.href);
            url.searchParams.delete("section");
            url.hash = section;
            replaceState(url, $page.state);
        }

        ready = true;
        await tick();

        // wait a frame so the sticky bars have measured themselves, then jump
        // there instantly (the section's scroll-margin clears both bars)
        if (target) {
            requestAnimationFrame(() => {
                document.getElementById(target)?.scrollIntoView({ block: "start" });
            });
        }
    });
</script>

<Seo
    title={seo.title}
    description={seo.description}
    canonicalPath={seo.path}
    jsonLd={seo.jsonLd}
    image="/Images/Meta/theory.jpg"
    imageAlt="A colorful circle of fifths with C major selected, next to the words Music Theory"
/>

<div class="theory_container">
    <KeyDetails key={selected} {looper} onSelect={select} bind:moreKind bind:morePosition>
        <CircleOfFifths slot="circle" {selected} onSelect={select} />
    </KeyDetails>
</div>

<Footer />
