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
    import NavDropdown from "../../buttons/NavDropdown.svelte";
    import MobileMenuToggler from "../../UI/MobileMenuToggler.svelte";
    import MobileNav from "./MobileNav.svelte";
    import Logo from "../../Icons/Logos/Logo.svelte";

    let isScrolled = false;
    let activeHash = "";

    const projectDetailItems = [
        { label: "Summary", linksTo: "/#summary" },
        { label: "Photos", linksTo: "/#photos" },
        { label: "Features", linksTo: "/#features" },
        { label: "Technologies", linksTo: "/#tech-stack" },
        { label: "Where's My PIN", linksTo: "/#wheres-my-pin" },
    ];

    const sectionIds = projectDetailItems.map((item) => item.linksTo.slice(2));

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
                        <Logo color="#f7f7f7" width="145px" />
                    </a>
                </div>

                <div class="nav_rightFlex">
                    <NavigationLink linkText="Home" linksTo="/" />

                    <NavigationLink linkText="Tracks" linksTo="/portal" />

                    <NavigationLink
                        linkText="Chord Builder"
                        linksTo="/chord-builder"
                    />

                    <NavigationLink
                        linkText="Add Track"
                        linksTo="/portal/add-beat"
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

                    <NavDropdown
                        label="Project Details"
                        items={projectDetailItems}
                        {activeHash}
                    />

                    <NavigationLink
                        linkText="Chord Builder"
                        linksTo="/chord-builder"
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
