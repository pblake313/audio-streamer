<script lang="ts">
    import "./Nav.css";
    import { mobileNavOpen } from "../../../stores/navstore";
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { logout } from "../../../helpers/Auth/authFunctions";
    import { user } from "../../../stores/UserStore";
    import GitHubLink from "../../links/GitHubLink.svelte";
    import BoxButton from "../../buttons/BoxButton.svelte";
    import NavigationLink from "../../buttons/NavigationLink.svelte";
    import MobileMenuToggler from "../../UI/MobileMenuToggler.svelte";
    import MobileNav from "./MobileNav.svelte";
    import { authorizedFetch } from "../../../helpers/Fetchers/authorizedFetch";
    import Logo from "../../Icons/Logos/Logo.svelte";
    import { fade, slide } from "svelte/transition";
    import { pushNotification } from "../../../stores/NotificationStore";

    let isScrolled = false;

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

    let isLoading: boolean = false

</script>

<!-- have a user. -->

<div class="nav_container" class:nav_scrolled={isScrolled}>
    <div class="nav_inside">
        {#if $user}
            <div class="nav_userFlex">
                <div class="nav_logoFlex">
                    <a href="/">
                        <Logo color={'#f7f7f7'} width="120px"/>
                    </a>
                </div>
                <div class="nav_rightFlex">
                             <NavigationLink
                        linkText={"Home"}
                        linksTo={"/"}
                    />
                    <NavigationLink linkText={"Tracks"} linksTo={"/portal"} />
                    <NavigationLink linkText={"Add Track"} linksTo={"/portal/add-beat"} />
                    <NavigationLink
                        linkText={"Manage"}
                        linksTo={"/portal/manage-beats"}
                    />
       
                    <BoxButton
                        buttonText={"Logout"}
                        on:click={logout}
                        tightPad={true}
                        buttonStyle={"glass"}
                    />
                </div>

                <div class="nav_mobileToggle">
                    <MobileMenuToggler />
                </div>
            </div>
        {:else}
            <div class="nav_noUserFlex">
                <div class="nav_githubFlex">
                    <GitHubLink gitText={"@pblake313"} />
                </div>

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
