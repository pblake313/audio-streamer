<script lang="ts">
    // $app/stores (not $app/state): $app/state is only reactive on Svelte 5
    import { page } from "$app/stores";

    /*
        Title, description, and link-preview tags (Open Graph + Twitter)
        for a page. Preview images and canonical links must be absolute
        URLs, so they're built from VITE_FRONTEND_URL. Set it to the live
        site URL before building for production.
    */
    const SITE_NAME = "Audio Streamer · PATTSWAY";
    const SITE_URL = (import.meta.env.VITE_FRONTEND_URL || "https://demo.pattsway.com").replace(/\/+$/, "");

    const DEFAULT_DESCRIPTION =
        "A secure music streaming platform that allows producers and musicians to organize, review, compare, and test their mixes from anywhere.";

    export let title: string = SITE_NAME;
    export let description: string = DEFAULT_DESCRIPTION;

    // path under /static; 1920x1080 jpg (more widely supported than webp in link previews)
    export let image = "/Images/Meta/pattsway.jpg";
    export let imageAlt = "Audio Streamer by PATTSWAY";
    export let imageWidth = 1920;
    export let imageHeight = 1080;
    export let imageType = "image/jpeg";

    // private pages (portal, login, ...) stay out of search results
    export let noindex = false;

    $: fullTitle = title === SITE_NAME ? title : `${title} · PATTSWAY`;
    $: url = `${SITE_URL}${$page.url.pathname}`;
    $: imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;
</script>

<svelte:head>
    <title>{fullTitle}</title>
    <meta name="description" content={description} />

    {#if noindex}
        <meta name="robots" content="noindex, nofollow" />
    {:else}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
    {/if}

    <!-- Open Graph (iMessage, Facebook, LinkedIn, Discord, Slack, ...) -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={SITE_NAME} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={url} />
    <meta property="og:image" content={imageUrl} />
    <meta property="og:image:secure_url" content={imageUrl} />
    <meta property="og:image:type" content={imageType} />
    <meta property="og:image:width" content={String(imageWidth)} />
    <meta property="og:image:height" content={String(imageHeight)} />
    <meta property="og:image:alt" content={imageAlt} />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@pattsway93" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={imageUrl} />
    <meta name="twitter:image:alt" content={imageAlt} />
</svelte:head>
