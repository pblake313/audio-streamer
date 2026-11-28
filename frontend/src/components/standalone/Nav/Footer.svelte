<script lang="ts">
    import { showAudioPlayer } from "../../../stores/AudioPlayer/BeatsStore";
    import { scrollToHash } from "../../../helpers/scrollToHash";
    import Logo from "../../Icons/Logos/Logo.svelte";
    import GitHubIcon from "../../Icons/Logos/GitHubIcon.svelte";
    import "./Footer.css";

    const year = new Date().getFullYear();
    const repoUrl = "https://github.com/pblake313/audio-streamer";

    type FooterLink = { label: string; href: string; external?: boolean };

    const columns: { title: string; links: FooterLink[] }[] = [
        {
            title: "App",
            links: [
                { label: "Home", href: "/" },
                { label: "Your tracks", href: "/portal" },
                { label: "Log in", href: "/login" },
            ],
        },
        {
            title: "Tools",
            links: [
                { label: "Chord Builder", href: "/chord-builder" },
                { label: "Theory", href: "/theory" },
            ],
        },
        {
            title: "Project",
            links: [
                { label: "Summary", href: "/#summary" },
                { label: "Features", href: "/#features" },
                { label: "Technologies", href: "/#tech-stack" },
                { label: "Source code", href: repoUrl, external: true },
            ],
        },
    ];

    // in-page sections scroll smoothly, even from another route
    function handleLink(event: MouseEvent, link: FooterLink) {
        if (link.external || !link.href.includes("#")) return;
        event.preventDefault();
        scrollToHash(link.href);
    }

    function backToTop() {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    }
</script>

<footer class="footer_container">
    <div class="footer_insideContainer">
        <div class="footer_main">
            <!-- about -->
            <div class="footer_about">
                <a href="https://www.pattsway.com" class="footer_logo" aria-label="PATTSWAY website">
                    <Logo color={"#ffffff"} width={"100%"} />
                </a>
                <p class="footer_blurb">
                    A private vault for your unreleased music, plus tools to help you write it.
                </p>
                <a class="footer_github" href={repoUrl} target="_blank" rel="noopener noreferrer">
                    <GitHubIcon height="16px" color="currentColor" />
                    View on GitHub
                </a>
            </div>

            <!-- links -->
            <nav class="footer_columns" aria-label="Footer">
                {#each columns as column}
                    <div class="footer_column">
                        <p class="footer_columnTitle">{column.title}</p>
                        <ul>
                            {#each column.links as link}
                                <li>
                                    <a
                                        href={link.href}
                                        target={link.external ? "_blank" : undefined}
                                        rel={link.external ? "noopener noreferrer" : undefined}
                                        on:click={(e) => handleLink(e, link)}
                                    >
                                        {link.label}
                                        {#if link.external}
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                <path d="M7 17L17 7M9 7h8v8" />
                                            </svg>
                                        {/if}
                                    </a>
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/each}
            </nav>
        </div>

        <div class="footer_bottom">
            <p class="footer_copyright">© {year} PATTSWAY. All rights reserved.</p>
            <button type="button" class="footer_top" on:click={backToTop}>
                Back to top
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 19V5M6 11l6-6 6 6" />
                </svg>
            </button>
        </div>
    </div>
</footer>

<div class:footer_padForPlayer={$showAudioPlayer}></div>
