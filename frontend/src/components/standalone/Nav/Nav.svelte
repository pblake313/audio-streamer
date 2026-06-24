<script lang="ts">
    import "./Nav.css";
    import { page } from "$app/stores";
    import { navOpen, navStyle } from "../../../stores/navstore";
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

<div class="nav_container">
    <div class="nav_inside">
        {#if $user}
            <div
                class="navContainer"
                class:scrolled={isScrolled || $navOpen}
                class:addLine={$navStyle.addLine}
            >
                <div class="insideNav" class:maxoutnav={$navStyle.capWidth}>
                    <div class="leftSideNav">
                        <button
                            class="logoButtonRouter"
                            on:click={() => {
                                goto("/portal");
                            }}
                        >
                            <div class="wrapDeskHomeLogo">
                                <Logo color={"#f7f7f7"} width={"120px"}></Logo>
                            </div>
                            <div class="wrapMobileHomeLogo">
                                <Logo color={"#f7f7f7"} width={"100px"}></Logo>
                            </div>
                        </button>

                        <button on:click={logout} class="logoutJoint">
                            <p style="font-size: 9pt;">Logout</p>
                            <LogoutIcon height={"15px"} color={"#f7f7f7"}
                            ></LogoutIcon>
                        </button>
                    </div>

                    <!-- is removed for mobile -->
                    <div class="loginFlex">
                        <div class="flexcartside">
                            <div class="navButtons">
                                <a
                                    class:navActive={isActive("/portal")}
                                    class="desktopNavigation"
                                    href="/portal">Listen</a
                                >

                                <a
                                    class:navActive={isActive(
                                        "/portal/manage-beats",
                                    )}
                                    class="desktopNavigation"
                                    href="/portal/manage-beats">Manage</a
                                >
                            </div>

                            <div class="mobileNavButtons">
                                <button
                                    class:navActive={isActive("/portal")}
                                    on:click={(e) => {
                                        goto("/portal");
                                    }}
                                    class="mainNavBtn"
                                >
                                    <EarIcon></EarIcon>
                                </button>

                                <a
                                    class:navActive={isActive(
                                        "/portal/manage-beats",
                                    )}
                                    class="mainNavBtn"
                                    href="/portal/manage-beats"
                                >
                                    <SettingsIcon></SettingsIcon>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <div class="nav_noUserFlex">
      
                <GitHubLink gitText={"@pblake313"} />


                <div class="nav_rightFlex">
                    <NavigationLink linkText={"Project Details"} linksTo={"/"}/>
 

                    <BoxButton buttonText={"Login"} tightPad={true} on:click={() => {
                        goto('/login')
                    }}/>

                </div>
            </div>
        {/if}
    </div>
</div>