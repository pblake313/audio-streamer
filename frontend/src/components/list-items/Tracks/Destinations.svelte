<script lang="ts">
    import type { Beat } from "../../../lib/types/Beats";
    import AppLogo from "../../Icons/Logos/AppLogo.svelte";
    import SoundcloudIcon from "../../Icons/Socials/SoundcloudIcon.svelte";
    import YoutubeIcon from "../../Icons/Socials/YoutubeIcon.svelte";
    import "./Destinations.css";

    export let beat: Beat;
</script>

<div class="destinations_flex">
    {#if beat.futureDestinations.includes("Pattsway")}

        <div class="destinations_desk">

            <AppLogo width={"18px"} />
        </div>
        <div class="destinations_mobile">

            <AppLogo width={"16px"} />
        </div>
    {/if}
    {#if beat.futureDestinations.includes("Soundcloud")}
        <SoundcloudIcon height={"25px"} color={"#FF5500"} />
    {/if}
    {#if beat.futureDestinations.includes("Youtube")}
        <div style="padding-bottom: 3px;">

            <YoutubeIcon height={"23px"} color={"#FF0000"} />
        </div>
    {/if}
</div>
