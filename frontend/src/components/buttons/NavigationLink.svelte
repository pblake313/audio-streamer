<script lang="ts">
    import { page } from "$app/stores";
    import { scrollToHash } from "../../helpers/scrollToHash";
    import "./NavigationLink.css";

    export let linksTo: string;
    export let linkText: string;
    export let activeHash = "";

    $: targetUrl = new URL(linksTo, $page.url.origin);

    $: pathnameMatches =
        $page.url.pathname === targetUrl.pathname;

    $: hashMatches = targetUrl.hash
        ? activeHash === targetUrl.hash
        : activeHash === "";

    $: isActive = pathnameMatches && hashMatches;

    function handleClick(event: MouseEvent) {
        // Let normal links behave normally
        if (!new URL(linksTo, window.location.origin).hash) return;

        event.preventDefault();
        scrollToHash(linksTo);
    }
</script>

<a
    href={linksTo}
    class="navLink"
    class:active={isActive}
    on:click={handleClick}
>
    {linkText}
</a>
