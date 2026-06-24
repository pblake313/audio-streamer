<script lang="ts">
    import GitHubIcon from "../Icons/Logos/GitHubIcon.svelte";
    import InstagramIcon from "../Icons/Socials/InstagramIcon.svelte";
    import LinkedinIcon from "../Icons/Socials/LinkedinIcon.svelte";
    import MetaIcon from "../Icons/Socials/MetaIcon.svelte";
    import SoundcloudIcon from "../Icons/Socials/SoundcloudIcon.svelte";
    import XIcon from "../Icons/Socials/XIcon.svelte";
    import YoutubeIcon from "../Icons/Socials/YoutubeIcon.svelte";
    import "./SocialButton.css";

    export let buttonType:
        | "meta"
        | "linkedin"
        | "instagram"
        | "youtube"
        | "x"
        | "github"
        | "soundcloud";
    export let color: string = "#f7f7f7";
    export let height: string = '24px';
</script>

{#if buttonType === "x"}
    <a class="socialLink" target="_blank" href="https://x.com/pattsway93">
        <XIcon {color} {height} />
    </a>
{:else if buttonType === "meta"}
    <a class="socialLink" target="_blank" href="https://www.google.com">
        <MetaIcon {color} {height} />
    </a>
{:else if buttonType === "instagram"}
    <a class="socialLink" target="_blank" href="https://www.instagram.com/pattsway93">
        <InstagramIcon {color} {height} />
    </a>
{:else if buttonType === "linkedin"}
    <a class="socialLink" target="_blank" href="https://www.google.com">
        <LinkedinIcon {color} {height} />
    </a>
{:else if buttonType === "youtube"}
    <a
        class="socialLink"
        target="_blank"
        href="https://www.youtube.com/@pattsway"
    >
        <YoutubeIcon {color} {height} />
    </a>
{:else if buttonType === "github"}
    <a
        class="socialLink"
        target="_blank"
        href="https://github.com/pblake313"
    >
        <GitHubIcon {color} {height}/>
    </a>
{:else if buttonType === "soundcloud"}
    <a class="socialLink" target="_blank" href="https://soundcloud.com/pattsway">
        <SoundcloudIcon {color} {height} />
    </a>
{/if}
