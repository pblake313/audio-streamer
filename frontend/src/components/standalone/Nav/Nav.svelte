<script lang="ts">
    import "./Nav.css";
    import { page } from "$app/stores";
    import { mobileNavOpen, navOpen, navStyle } from "../../../stores/navstore";
    import EarIcon from "../../Icons/svg/EarIcon.svelte";
    import SettingsIcon from "../../Icons/svg/SettingsIcon.svelte";
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { logout } from "../../../helpers/Auth/authFunctions";
    import LogoutIcon from "../../Icons/svg/LogoutIcon.svelte";
    import Logo from "../../Icons/Logos/Logo.svelte";
    import { user } from "../../../stores/UserStore";
    import GitHubLink from "../../links/GitHubLink.svelte";
    import BoxButton from "../../buttons/BoxButton.svelte";
    import GitHubIcon from "../../Icons/Logos/GitHubIcon.svelte";
    import NavigationLink from "../../buttons/NavigationLink.svelte";
    import MobileMenuToggler from "../../UI/MobileMenuToggler.svelte";
    import MobileNav from "./MobileNav.svelte";

    let isScrolled = false;

    $: isActive = (route: any) => $page.url.pathname === route;

    $: isOnBeatPage = $page.url.pathname.startsWith("/portal");

    let handleScroll: () => void;

    if (browser) {
        onMount(() => {
            handleScroll = () => {
                isScrolled = window.scrollY > 0;
            };

            handleScroll(); // initial check
            window.addEventListener("scroll", handleScroll);
        });

        onDestroy(() => {
            window.removeEventListener("scroll", handleScroll);
        });
    }
</script>

<!-- have a user. -->

<div class="nav_container" class:nav_scrolled={isScrolled}>
    <div class="nav_inside">
        {#if $user}
            <div class="nav_userFlex">
                <GitHubLink gitText={"@pblake313"} />
                <div class="nav_rightFlex">
                    <NavigationLink linkText={"Portal"} linksTo={"/portal"} />
                    <NavigationLink
                        linkText={"Manage"}
                        linksTo={"/portal/manage-beats"}
                    />
                    <NavigationLink
                        linkText={"Project Details"}
                        linksTo={"/"}
                    />
                    <BoxButton buttonText={"Logout"} on:click={logout} tightPad={true}/>
    
                </div>

                <div class="nav_mobileToggle">
                    <MobileMenuToggler />
                </div>
            </div>
        {:else}
            <div class="nav_noUserFlex">
                <GitHubLink gitText={"@pblake313"} />

                <div class="nav_rightFlex">
                    <NavigationLink
                        linkText={"Project Details"}
                        linksTo={"/"}
                    />

                    <BoxButton
                        buttonText={"Login"}
                        tightPad={true}
                        on:click={() => {
                            goto("/login");
                        }}
                    />
                </div>

                <div class="nav_mobileToggle">
                    <MobileMenuToggler />
                </div>
            </div>
        {/if}
    </div>
</div>

{#if $mobileNavOpen}
    <MobileNav />
{/if}
