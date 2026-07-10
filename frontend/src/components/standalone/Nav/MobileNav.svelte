<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    import {
        closeMobileNav,
        mobileNavOpen,
    } from "../../../stores/navstore";

    import { user } from "../../../stores/UserStore";
    import { logout } from "../../../helpers/Auth/authFunctions";

    import "./MobileNav.css";
    import Logo from "../../Icons/Logos/Logo.svelte";
    import MobileNavLink from "../../buttons/MobileNavLink.svelte";
    import { selectedBeat } from "../../../stores/AudioPlayer/selectedBeatStore";
    import { audioMode, audioPlayerState, pauseTrack, playTrack, resetTrackTimer, userTapped } from "../../../stores/AudioPlayerStore";
    import MobileNavAudioControls from "./MobileNavAudioControls.svelte";

    let videoReady = false;

    function isRouteActive(path: string, exact = false) {
        const currentPath = $page.url.pathname;

        if (exact) {
            return currentPath === path;
        }

        return (
            currentPath === path ||
            currentPath.startsWith(`${path}/`)
        );
    }

    async function goToPage(path: string) {
        if ($page.url.pathname === path) {
            closeMobileNav();
            return;
        }

        await goto(path);

        closeMobileNav();
    }

    async function handleLogout() {
        closeMobileNav();

        try {
            await logout();
            await goto("/");
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    }

    function handleContainerClick(event: MouseEvent) {
        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const interactiveElement = target.closest(
            "button, a, input, textarea, select, [role='button']"
        );

        if (interactiveElement) {
            return;
        }

        closeMobileNav();
    }

    function handleWindowClick() {
        if (!$mobileNavOpen) {
            return;
        }

        closeMobileNav();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key !== "Escape" || !$mobileNavOpen) {
            return;
        }

        closeMobileNav();
    }

    onMount(() => {
        /*
            Prevent the same click that opened the mobile nav
            from immediately closing it.
        */
        const timeout = window.setTimeout(() => {
            window.addEventListener("click", handleWindowClick);
            window.addEventListener("keydown", handleKeydown);
        }, 0);

        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener("click", handleWindowClick);
            window.removeEventListener("keydown", handleKeydown);
        };
    });



</script>

<div
    class="mobileNav_container"
    class:mobileNav_open={$mobileNavOpen}
    class:mobileNav_clear={!$mobileNavOpen}
    aria-hidden={!$mobileNavOpen}
    on:click|stopPropagation={handleContainerClick}
>
    <div
        class="mobileNav_videoFade"
        class:mobileNav_videoVisible={$mobileNavOpen && videoReady}
    >
        <video
            class="mobileNav_video"
            src="/Videos/glasslina.mp4"
            autoplay
            loop
            muted
            playsinline
            on:loadeddata={() => {
                videoReady = true;
            }}
        ></video>
    </div>

    <div class="mobileNav_content">
        <div class="mobileNav_links">

            {#if $user && $selectedBeat && $userTapped && $audioPlayerState !== 'Idle' && $audioMode === 'streamer'}
                <MobileNavAudioControls beat={$selectedBeat}/>


            {/if}

            <div class="mobileNav_linkItem">
                <MobileNavLink
                    isActive={isRouteActive("/", true)}
                    title="Home"
                    on:click={() => goToPage("/")}
                />
            </div>

            {#if $user}
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/portal", true)}
                        title="Listen"
                        on:click={() => goToPage("/portal")}
                    />
                </div>

                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/portal/add-beat")}
                        title="Add Track"
                        on:click={() => goToPage("/portal/add-beat")}
                    />
                </div>

                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/portal/manage-beats")}
                        title="Manage"
                        on:click={() => goToPage("/portal/manage-beats")}
                    />
                </div>

                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        title="Logout"
                        on:click={handleLogout}
                    />
                </div>
            {:else}
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/login")}
                        title="Login"
                        on:click={() => goToPage("/login")}
                    />
                </div>
            {/if}
        </div>

        <a
            href="https://www.pattsway.com"
            class="mobileNav_pattsway"
            on:click|stopPropagation={closeMobileNav}
        >
            <p class="mobileNav_projectText">
                A project by
            </p>

            <Logo
                width="100px"
                color="#f7f7f7"
            />
        </a>
    </div>
</div>