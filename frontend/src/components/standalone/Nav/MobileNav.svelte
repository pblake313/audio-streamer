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
    <!-- ambient light, same as the login page: grid + blue and teal glows -->
    <div
        class="mobileNav_backdrop"
        class:mobileNav_backdropVisible={$mobileNavOpen}
        aria-hidden="true"
    >
        <div class="mobileNav_grid"></div>
        <div class="mobileNav_orb mobileNav_orb_a"></div>
        <div class="mobileNav_orb mobileNav_orb_b"></div>
    </div>
    <div class="mobileNav_content">
        <div class="mobileNav_links">
            {#if $user && $selectedBeat && $userTapped && $audioPlayerState !== "Idle" && $audioMode === "streamer"}
                <MobileNavAudioControls beat={$selectedBeat} />
            {/if}

            {#if $user}
            <div class="mobileNav_group">
                <p class="mobileNav_groupLabel">Vault</p>
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
                        isActive={isRouteActive("/portal/traffic", true)}
                        title="Traffic"
                        on:click={() => goToPage("/portal/traffic")}
                    />
                </div>
            </div>

            <div class="mobileNav_group">
                <p class="mobileNav_groupLabel">Tools</p>
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/chord-builder")}
                        title="Chord Builder"
                        on:click={() => goToPage("/chord-builder")}
                    />
                </div>
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/theory")}
                        title="Theory"
                        on:click={() => goToPage("/theory")}
                    />
                </div>
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/portal/converter", true)}
                        title="Converter"
                        on:click={() => goToPage("/portal/converter")}
                    />
                </div>
            </div>

            <div class="mobileNav_group">
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={$page.url.pathname === "/" && activeHash === ""}
                        title="Home"
                        on:click={() => goToPage("/")}
                    />
                </div>
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        title="Log out"
                        on:click={handleLogout}
                    />
                </div>
            </div>
            {:else}
            <div class="mobileNav_group">
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={$page.url.pathname === "/" && activeHash === ""}
                        title="Home"
                        on:click={() => goToPage("/")}
                    />
                </div>
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/login", true)}
                        title="Log in"
                        on:click={() => goToPage("/login")}
                    />
                </div>
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/chord-builder")}
                        title="Chord Builder"
                        on:click={() => goToPage("/chord-builder")}
                    />
                </div>
                <div class="mobileNav_linkItem">
                    <MobileNavLink
                        isActive={isRouteActive("/theory")}
                        title="Theory"
                        on:click={() => goToPage("/theory")}
                    />
                </div>
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
