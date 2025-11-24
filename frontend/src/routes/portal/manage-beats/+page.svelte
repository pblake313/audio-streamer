<script lang="ts">
    import { onMount } from "svelte";
    import { navStyle } from "../../../stores/navstore";
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
    } from "../../../stores/AudioPlayer/beatArrayStore";
    import DashboardLoader from "../../../components/loaders/PageLoaders/DashboardLoader.svelte";
    import AddTrackPointer from "../../../components/page-components/AddTrackPointer.svelte";
    import FormError from "../../../components/errors/FormError.svelte";

    import "./ManageBeatsPage.css";
    import ManageBeatListItem from "../../../components/list-items/ManageBeatListItem/ManageBeatListItem.svelte";
    import SpinLoader from "../../../components/loaders/SpinLoader.svelte";

    let loadingNewBeats: boolean = false;

    onMount(async () => {
        await loadBeats();
        navStyle.set({ style: "standard", capWidth: false, addLine: false });
    });

    async function loadBeats() {
        try {
            await fetchBeats();
        } catch (error) {
            // console.error('Failed to fetch beats', error);
        }
    }

    async function loadMoreBeats() {
        // console.log($beatPagesFetched)
        if ($allBeatPagesFetched) {
            // console.log('Already fetched all beat pages!')
            return;
        }

        loadingNewBeats = true;

        try {
            await fetchBeats(getNextBeatPageToFetch());
            loadingNewBeats = false;
        } catch {
            console.log("an error fetching public beats...");
            loadingNewBeats = false;
        }
    }

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

{#if !$fetchBeatsAttempted}
    <DashboardLoader></DashboardLoader>
{:else if $beatFetchError}
    <div class="containBeatPage">
        <FormError
            errorMessage={$beatFetchError}
            errorTitle={"Beat Fetch Error"}
            textAlign={"center"}
        ></FormError>

        <div style="margin: auto; width:fit-content; margin-top: 20px;">
            <BoxButton buttonText={"Retry Fetch"} on:click={retryBeatsFetch}
            ></BoxButton>
        </div>
    </div>
{:else if $beats.length >= 1}
    <div class="containBeatPage">
        <div class="goToAddButton">
            <BoxButton
                buttonIcon={"add"}
                fullWidth={true}
                on:click={(e) => {
                    goto("/portal/add-beat");
                }}
                buttonStyle={"stockButton"}
                buttonText={"Add Beat"}
            ></BoxButton>
        </div>

        <div class="adminBeatGrid">
            {#each $beats as beat, i}
                <div class="wrapBeatChild">
                    <ManageBeatListItem
                        {beat}
                        isEven={i % 2 !== 0 ? true : false}
                    ></ManageBeatListItem>
                </div>
            {/each}
        </div>

        {#if !$allBeatPagesFetched}
            <div style="margin: auto; width: fit-content; margin-top: 50px;">
                {#if loadingNewBeats}
                    <div in:fade={{ duration: 200 }}>
                        <SpinLoader></SpinLoader>
                    </div>
                {:else}
                    <div in:fade={{ duration: 200 }}>
                        <BoxButton
                            buttonText={"Fetch More"}
                            on:click={loadMoreBeats}
                        ></BoxButton>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{:else}
    <AddTrackPointer></AddTrackPointer>
{/if}
