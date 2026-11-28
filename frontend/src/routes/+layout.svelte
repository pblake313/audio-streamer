<script lang="ts">
    import "./styles.css";
    import "./Homepage.css";

    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { afterNavigate } from "$app/navigation";
    import { trackPageView } from "../helpers/trackPageView";

    // one page view per page load or in-app navigation (for the portal's Traffic page)
    afterNavigate(({ to, from, type }) => {
        if (!to?.url) return;
        // a hash jump within the same page isn't a new page view
        if (type !== "enter" && from?.url.pathname === to.url.pathname) return;
        trackPageView(to.url.pathname);
    });

    import {
        attemptingAutoLogin,
        autoLogin,
        autoLoginAttempted,
    } from "../helpers/Auth/authFunctions";


    import NotificationsList from "../components/standalone/Notificaitons/NotificationsList.svelte";
    import Nav from "../components/standalone/Nav/Nav.svelte";
    import Loader from "../components/loaders/Loader.svelte";
    import AudioStreamer from "../components/standalone/AudioStreamer.svelte";
    import { getSocket } from "../stores/socketStore";

    onMount(() => {
        let socket: Awaited<ReturnType<typeof getSocket>> | null = null;
        let destroyed = false;

        async function initialize() {
            if (!$autoLoginAttempted) {
                await autoLogin();
            }

            if (destroyed) {
                return;
            }

            socket = await getSocket();

            if (destroyed) {
                return;
            }

        }

        initialize().catch((error) => {
            console.error("Application initialization failed:", error);
        });

        return () => {
            destroyed = true;
        };
    });
</script>

<NotificationsList />

{#if $attemptingAutoLogin}
    <div in:fade={{ duration: 500 }}>
        <Loader loaderStyle="loader_full" />
    </div>
{:else}
    <div in:fade={{ duration: 500, delay: 500 }}>
        <Nav />
        <slot></slot>
    </div>
{/if}

<AudioStreamer />