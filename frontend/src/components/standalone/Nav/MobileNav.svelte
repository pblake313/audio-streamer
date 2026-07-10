<script lang="ts">
    import { onMount, tick } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    import { closeMobileNav, mobileNavOpen } from "../../../stores/navstore";

    import { user } from "../../../stores/UserStore";
    import { logout } from "../../../helpers/Auth/authFunctions";

    import "./MobileNav.css";

    import Logo from "../../Icons/Logos/Logo.svelte";
    import MobileNavLink from "../../buttons/MobileNavLink.svelte";
    import MobileNavAudioControls from "./MobileNavAudioControls.svelte";

    import { selectedBeat } from "../../../stores/AudioPlayer/selectedBeatStore";

    import {
        audioMode,
        audioPlayerState,
        userTapped,
    } from "../../../stores/AudioPlayerStore";

    let videoReady = false;
    let activeHash = "";

    const sectionIds = ["summary", "photos", "features", "wheres-my-pin"];

    function isRouteActive(path: string, exact = false) {
        const currentPath = $page.url.pathname;

        if (exact) {
            return currentPath === path;
        }

        return currentPath === path || currentPath.startsWith(`${path}/`);
    }

    function updateActiveSection() {
        if ($page.url.pathname !== "/") {
            activeHash = "";
            return;
        }

        const activationOffset = 160;
        const scrollPosition = window.scrollY + activationOffset;

        if (window.scrollY < 100) {
            activeHash = "";
            return;
        }

        let currentSection = "";

        for (const id of sectionIds) {
            const section = document.getElementById(id);

            if (!section) {
                continue;
            }

            const sectionTop =
                section.getBoundingClientRect().top + window.scrollY;

            if (sectionTop <= scrollPosition) {
                currentSection = `#${id}`;
            }
        }

        activeHash = currentSection;
    }

    function isHashActive(hash: string) {
        return $page.url.pathname === "/" && activeHash === hash;
    }

    async function waitForPageRender() {
        await tick();

        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resolve();
                });
            });
        });
    }

    async function goToPage(path: string) {
        const targetUrl = new URL(path, window.location.origin);

        const targetPath = targetUrl.pathname;
        const targetHash = targetUrl.hash;
        const targetId = targetHash.slice(1);

        closeMobileNav();

        /*
            Navigate to the route without allowing SvelteKit
            or the browser to perform its own hash scroll.
        */
        if ($page.url.pathname !== targetPath) {
            await goto(targetPath, {
                noScroll: true,
                keepFocus: true,
            });

            await waitForPageRender();
        }

        /*
            Section link.
        */
        if (targetId) {
            const targetElement = document.getElementById(targetId);

            if (!targetElement) {
                console.warn(`Could not find section: #${targetId}`);
                return;
            }

            /*
                Update the address bar without triggering
                another native hash scroll.
            */
            history.replaceState(
                history.state,
                "",
                `${targetPath}${targetHash}`,
            );

            targetElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });

            return;
        }

        /*
            Normal route or Home link.
        */
        if ($page.url.pathname !== targetPath) {
            await goto(targetPath);
            return;
        }

        history.replaceState(history.state, "", targetPath);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
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
            "button, a, input, textarea, select, [role='button']",
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
        updateActiveSection();

        window.addEventListener("scroll", updateActiveSection, {
            passive: true,
        });

        window.addEventListener("resize", updateActiveSection);

        const timeout = window.setTimeout(() => {
            window.addEventListener("click", handleWindowClick);

            window.addEventListener("keydown", handleKeydown);
        }, 0);

        return () => {
            window.clearTimeout(timeout);

            window.removeEventListener("scroll", updateActiveSection);

            window.removeEventListener("resize", updateActiveSection);

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
            {#if $user && $selectedBeat && $userTapped && $audioPlayerState !== "Idle" && $audioMode === "streamer"}
                <MobileNavAudioControls beat={$selectedBeat} />
            {/if}

            <div class="mobileNav_linkItem">
                <MobileNavLink
                    isActive={$page.url.pathname === "/" && activeHash === ""}
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
                    <MobileNavLink title="Logout" on:click={handleLogout} />
                </div>
            {:else}
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/login", true)}
                        title="Login"
                        on:click={() => goToPage("/login")}
                    />
                </div>

                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isHashActive("#summary")}
                        title="Summary"
                        on:click={() => goToPage("/#summary")}
                    />
                </div>

                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isHashActive("#photos")}
                        title="Photos"
                        on:click={() => goToPage("/#photos")}
                    />
                </div>

                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isHashActive("#features")}
                        title="Features"
                        on:click={() => goToPage("/#features")}
                    />
                </div>

                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isHashActive("#wheres-my-pin")}
                        title="Where's My PIN"
                        on:click={() => goToPage("/#wheres-my-pin")}
                    />
                </div>
            {/if}
        </div>

        <a
            href="https://www.pattsway.com"
            class="mobileNav_pattsway"
            on:click|stopPropagation={closeMobileNav}
        >
            <p class="mobileNav_projectText">A project by</p>

            <Logo width="100px" color="#f7f7f7" />
        </a>
    </div>
</div>
