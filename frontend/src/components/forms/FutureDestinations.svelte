<script lang="ts">
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import type { Beat, FutureDestination } from "../../lib/types/Beats";
    import { upsertBeat } from "../../stores/AudioPlayer/BeatsStore";
    import { setPopupError } from "../../stores/PopupBeatStore";
    import AppLogo from "../Icons/Logos/AppLogo.svelte";
    import Logo from "../Icons/Logos/Logo.svelte";
    import SoundcloudIcon from "../Icons/Socials/SoundcloudIcon.svelte";
    import YoutubeIcon from "../Icons/Socials/YoutubeIcon.svelte";
    import Loader from "../loaders/Loader.svelte";
    import "./FutureDestinations.css";

    export let beat: Beat;
    export let isLoading: boolean = false;

    let loadingDestination: FutureDestination | null = null;

    async function handleDestination(destination: FutureDestination) {
        try {
            if (isLoading) return;

            isLoading = true;
            loadingDestination = destination;

            const response = await authorizedFetch(
                `/secure/beats/toggle-destination/${beat.id}`,
                {
                    method: "POST",
                    body: JSON.stringify({ destination }),
                },
            );

            beat = response.beat;
            upsertBeat(response.beat);
        } catch (err: any) {
            const errorMessage =
                err.message || "An unknown error has occurred.";

            setPopupError(errorMessage);
        } finally {
            isLoading = false;
            loadingDestination = null;
        }
    }
</script>


<div class="fd_buttonFlex">

    <button
        class="fd_button"
        class:fd_nonActivePattsway={!beat.futureDestinations.includes(
            "Pattsway",
        )}
        on:click={() => handleDestination("Pattsway")}
    >
        {#if loadingDestination === "Pattsway"}
            <div class="fd_loadWrap">
                <Loader height="25px" />
            </div>
        {:else}
            <div class="fd_pattsway fd_largeLogo">
                <Logo color={"#f7f7f7"} width={"100px"} />
            </div>
            <div class="fd_pattsway fd_appLogo">
                <AppLogo width={"18px"}/>
            </div>
        {/if}
    </button>

    <button
        class="fd_button"
        class:fd_nonActiveSoundcloud={!beat.futureDestinations.includes(
            "Soundcloud",
        )}
        on:click={() => handleDestination("Soundcloud")}
    >
        {#if loadingDestination === "Soundcloud"}
            <div class="fd_loadWrap">
                <Loader height="25px" />
            </div>
        {:else}
            <SoundcloudIcon height={"28px"} color={"#FF5500"} />
        {/if}
    </button>

    <button
        class="fd_button"
        class:fd_nonActive={!beat.futureDestinations.includes("Youtube")}
        on:click={() => handleDestination("Youtube")}
    >
        {#if loadingDestination === "Youtube"}
            <div class="fd_loadWrap">
                <Loader height="25px" />
            </div>
        {:else}
            <div style="padding-bottom: 2px;">
                <YoutubeIcon height={"27px"} color={"#FF0000"} />
            </div>
        {/if}
    </button>


</div>