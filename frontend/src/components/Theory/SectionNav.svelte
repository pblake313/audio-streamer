<script lang="ts">
    import "./SectionNav.css";

    import { onDestroy, onMount } from "svelte";
    import { page } from "$app/stores";
    import { replaceState } from "$app/navigation";
    import { dragScroll } from "../../helpers/dragScroll";

    /*
        Sticky row of links to the theory page's sections. Sits just under the
        site's fixed nav (measured, since its height changes per breakpoint),
        smooth-scrolls to a section on click, and lights up whichever section
        you're reading. On narrow screens the row swipes and keeps the active
        link in view.

        Sets --kd-jump on the page so each section's scroll-margin clears both bars.
    */
    export let sections: { id: string; label: string }[];

    let bar: HTMLElement;
    let scroller: HTMLElement;
    let top = 0;
    let active = sections[0]?.id ?? "";
    let raf = 0;
    let resizeObserver: ResizeObserver | null = null;

    function measure() {
        const siteNav = document.querySelector<HTMLElement>(".nav_container");
        top = siteNav?.offsetHeight ?? 0;
        const root = document.documentElement.style;
        // where a section's top lands after a jump: under both bars, with a little air
        root.setProperty("--kd-jump", `${top + (bar?.offsetHeight ?? 0) + 20}px`);
        // the site nav's height, so on phones / tablets the page can start with
        // this bar already stuck right under it (TheoryPage.css)
        root.setProperty("--kd-site-nav", `${top}px`);
        onScroll();
    }

    function onScroll() {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            const line = top + (bar?.offsetHeight ?? 0) + 40;
            let current = sections[0]?.id ?? "";
            for (const { id } of sections) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= line) current = id;
            }
            // at the very bottom the last section may be too short to reach the line
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
                current = sections[sections.length - 1]?.id ?? current;
            }
            if (current !== active) {
                active = current;
                revealActive();
            }
        });
    }

    // keep the active link visible in the swipeable row (without moving the page)
    function revealActive() {
        const link = scroller?.querySelector<HTMLElement>(`[data-id="${active}"]`);
        if (!link || scroller.scrollWidth <= scroller.clientWidth) return;
        const left = link.offsetLeft - (scroller.clientWidth - link.offsetWidth) / 2;
        scroller.scrollTo({ left, behavior: reducedMotion() ? "auto" : "smooth" });
    }

    const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function jump(event: MouseEvent, id: string) {
        const el = document.getElementById(id);
        if (!el) return; // let the browser follow the hash
        event.preventDefault();
        // keeps the ?key=... part, so the link stays shareable
        const url = new URL(window.location.href);
        url.hash = id;
        replaceState(url, $page.state);
        el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    }

    onMount(() => {
        measure();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", measure);
        const siteNav = document.querySelector<HTMLElement>(".nav_container");
        resizeObserver = new ResizeObserver(measure);
        if (siteNav) resizeObserver.observe(siteNav);
        resizeObserver.observe(bar);
    });

    onDestroy(() => {
        if (typeof window === "undefined") return;
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", measure);
        resizeObserver?.disconnect();
        cancelAnimationFrame(raf);
        document.documentElement.style.removeProperty("--kd-jump");
        document.documentElement.style.removeProperty("--kd-site-nav");
    });
</script>

<nav class="sn" style:top="{top}px" bind:this={bar} aria-label="Sections on this page">
    <div class="sn_scroll" bind:this={scroller} use:dragScroll>
        <!-- anything pinned to the bar (the theory page's key picker): at the
             right end on wide screens, first in the swipeable row when it's tight -->
        {#if $$slots.end}
            <div class="sn_end"><slot name="end" /></div>
        {/if}

        {#each sections as section}
            <a
                href="#{section.id}"
                class="sn_link"
                class:sn_linkOn={active === section.id}
                aria-current={active === section.id ? "location" : undefined}
                data-id={section.id}
                on:click={(event) => jump(event, section.id)}>{section.label}</a
            >
        {/each}
    </div>
</nav>
