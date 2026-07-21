<script lang="ts">
    import "./Nav.css";

    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    import { mobileNavOpen } from "../../../stores/navstore";
    import { user } from "../../../stores/UserStore";
    import { logout } from "../../../helpers/Auth/authFunctions";

    import GitHubLink from "../../links/GitHubLink.svelte";
    import BoxButton from "../../buttons/BoxButton.svelte";
    import NavigationLink from "../../buttons/NavigationLink.svelte";
    import MobileMenuToggler from "../../UI/MobileMenuToggler.svelte";
    import MobileNav from "./MobileNav.svelte";
    import Logo from "../../Icons/Logos/Logo.svelte";

    let isScrolled = false;
    let activeHash = "";

    const sectionIds = ["summary", "photos", "features", "wheres-my-pin"];

    function updateActiveSection() {
        isScrolled = window.scrollY > 0;

        const activationOffset = 160;
        const scrollPosition = window.scrollY + activationOffset;

        if (window.scrollY < 100) {
            activeHash = "";
            return;
        }

        let currentSection = "";

        for (const id of sectionIds) {
            const section = document.getElementById(id);

            if (!section) continue;

            const sectionTop =
                section.getBoundingClientRect().top + window.scrollY;

            if (sectionTop <= scrollPosition) {
                currentSection = `#${id}`;
            }
        }

        activeHash = currentSection;
    }

    onMount(() => {
        updateActiveSection();

        window.addEventListener("scroll", updateActiveSection, {
            passive: true,
        });

        window.addEventListener("resize", updateActiveSection);

        return () => {
            window.removeEventListener("scroll", updateActiveSection);

            window.removeEventListener("resize", updateActiveSection);
        };
    });
</script>

<div
    class="nav_container"
    class:nav_scrolled={isScrolled}
    class:nav_scrolledMobileNav={isScrolled && $mobileNavOpen}
>
    <div class="nav_inside">
        {#if $user}
            <div class="nav_userFlex">
                <div class="nav_logoFlex">
                    <a href="/" aria-label="Go to home page">
                        <Logo color="#f7f7f7" width="120px" />
                    </a>
                </div>

                <div class="nav_rightFlex">
                    <NavigationLink linkText="Home" linksTo="/" />

                    <NavigationLink linkText="Tracks" linksTo="/portal" />

                    <NavigationLink
                        linkText="Add Track"
                        linksTo="/portal/add-beat"
                    />

                    <NavigationLink
                        linkText="Manage"
                        linksTo="/portal/manage-beats"
                    />
                    <NavigationLink
                        linkText="Converter"
                        linksTo="/portal/converter"
                    />

                    <BoxButton
                        buttonText="Logout"
                        on:click={logout}
                        tightPad={true}
                        buttonStyle="glass"
                    />
                </div>

                <div class="nav_mobileToggle">
                    <MobileMenuToggler />
                </div>
            </div>
        {:else}
            <div class="nav_noUserFlex">
                <div class="nav_githubFlex">
                    <GitHubLink gitText="@pblake313" />
                </div>

                <div class="nav_rightFlex">
                    <NavigationLink linkText="Home" linksTo="/" {activeHash} />

                    <NavigationLink
                        linkText="Summary"
                        linksTo="/#summary"
                        {activeHash}
                    />

                    <NavigationLink
                        linkText="Photos"
                        linksTo="/#photos"
                        {activeHash}
                    />

                    <NavigationLink
                        linkText="Features"
                        linksTo="/#features"
                        {activeHash}
                    />
                    <NavigationLink
                        linkText="Where's My PIN"
                        linksTo="/#wheres-my-pin"
                        {activeHash}
                    />

                    <BoxButton
                        buttonText="Login"
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
