import { tick } from "svelte";
import { goto } from "$app/navigation";

/**
 * Smooth-scrolls to a "/path#section" link, navigating to the path first
 * if we're on a different route. Returns false for links without a hash so
 * callers can let the browser handle them normally.
 */
export async function scrollToHash(linksTo: string): Promise<boolean> {
    const targetUrl = new URL(linksTo, window.location.origin);

    const targetPath = targetUrl.pathname;
    const targetHash = targetUrl.hash;
    const targetId = targetHash.slice(1);

    if (!targetHash) return false;

    // Coming from another route
    if (window.location.pathname !== targetPath) {
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
        return true;
    }

    // Change URL without triggering native hash scrolling
    history.replaceState(history.state, "", `${targetPath}${targetHash}`);

    targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
    });

    return true;
}
