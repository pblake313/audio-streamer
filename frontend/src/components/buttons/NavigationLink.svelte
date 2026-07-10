<script lang="ts">
    import { tick } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
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

    async function handleClick(event: MouseEvent) {
        const targetUrl = new URL(linksTo, window.location.origin);

        const targetPath = targetUrl.pathname;
        const targetHash = targetUrl.hash;
        const targetId = targetHash.slice(1);

        // Let normal links behave normally
        if (!targetHash) {
            return;
        }

        event.preventDefault();

        // Coming from another route
        if ($page.url.pathname !== targetPath) {
            await goto(targetPath, {
                noScroll: true,
                keepFocus: true,
            });

            await tick();

            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => resolve());
                });
            });
        }

        const targetElement = document.getElementById(targetId);

        if (!targetElement) {
            console.warn(`Could not find section: #${targetId}`);
            return;
        }

        // Change URL without triggering native hash scrolling
        history.replaceState(
            history.state,
            "",
            `${targetPath}${targetHash}`,
        );

        targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
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