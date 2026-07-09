<script lang="ts">
    import { onMount } from "svelte";
    import BoxButton from "../../../components/buttons/BoxButton.svelte";
    import { goto } from "$app/navigation";
    import { fade } from "svelte/transition";
    import {
        allBeatPagesFetched,
        beatFetchError,
        beats,
        fetchBeats,
        fetchBeatsAttempted,
        getNextBeatPageToFetch,
        isFetchingBeats,
    } from "../../../stores/AudioPlayer/BeatsStore";
    import DashboardLoader from "../../../components/loaders/PageLoaders/DashboardLoader.svelte";
    import AddTrackPointer from "../../../components/page-components/AddTrackPointer.svelte";
    import FormError from "../../../components/errors/FormError.svelte";

    import "./ManageBeatsPage.css";
    import ManageBeatListItem from "../../../components/list-items/ManageBeatListItem/ManageBeatListItem.svelte";
    import SpinLoader from "../../../components/loaders/Loader.svelte";
    import Loader from "../../../components/loaders/Loader.svelte";
    import PageHeading from "../../../components/page-components/PageHeading.svelte";

    let loadingNewBeats: boolean = false;

    onMount(async () => {
        if (!$fetchBeatsAttempted) {
            await fetchBeats();
        }
    });

    async function retryBeatsFetch() {
        try {
            fetchBeatsAttempted.set(false);
            await fetchBeats();
        } catch {}
    }
</script>

<svelte:head>
    <title>Manage Tracks</title>
</svelte:head>

<div style="margin-bottom: 125px;">
    {#if !$fetchBeatsAttempted || ($isFetchingBeats && $beats.length <= 0)}
        <Loader loaderStyle={"loader_full"} />
    {:else if $beatFetchError}
        <PageHeading
            title={"Fetch Beats Error"}
            subtitle={$beatFetchError}
            buttonText={"Retry"}
            onButtonClick={() => {
                fetchBeats();
            }}
        />
    {:else if $beats.length >= 1}
        <div class="mbp_container">
            <div class="mbp_topper">
                <h2>Manage Tracks</h2>
                <p class="mbp_subtitle">Edit your track items.</p>
            </div>

            <div class="mbp_grid">
                {#each $beats as beat, i}
                    <div class="wrapBeatChild">
                        <ManageBeatListItem {beat} />
                    </div>
                {/each}
            </div>
        </div>

        {#if !$allBeatPagesFetched}
            <div class="mbp_fetchMore">
                <BoxButton
                    tightPad={true}
                    buttonText={$isFetchingBeats ? null : "Fetch More"}
                    buttonIcon={$isFetchingBeats ? "loading" : null}
                    isDisabled={$isFetchingBeats}
                    on:click={() => {
                        fetchBeats();
                    }}
                />
            </div>
        {/if}
    {:else}
        <AddTrackPointer />
    {/if}
</div>
