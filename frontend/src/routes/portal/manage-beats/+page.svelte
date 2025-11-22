<script lang="ts">
    import { onMount } from  "svelte";
    import AdminBeatListItem from "../../../components/reusable/AdminBeatListItem/AdminBeatListItem.svelte";
    import { navStyle } from "../../../stores/navstore";
    import BoxButton from "../../../components/buttons/BoxButton.svelte";
    import { goto } from "$app/navigation";
    import TightButton from "../../../components/buttons/TightButton.svelte";
    import { fade } from "svelte/transition";
    import { allBeatPagesFetched, beatFetchError, beats, fetchBeats, fetchBeatsAttempted, getNextBeatPageToFetch } from "../../../stores/AudioPlayer/beatArrayStore";
    import SpinLoader from "../../../components/reusable/Loaders/SpinLoader.svelte";
    import DashboardLoader from "../../../components/reusable/Loaders/PageLoaders/DashboardLoader.svelte";
    import AddTrackPointer from "../../../components/pointers/AddTrackPointer.svelte";
    import FormError from "../../../components/reusable/FormError.svelte";

    import './ManageBeatsPage.css'

    let loadingNewBeats: boolean = false

    onMount(async () => {
        await loadBeats();
        navStyle.set({style: 'standard', capWidth:false, addLine: false})

    });

    async function loadBeats() {
        try {
            await fetchBeats();
        } catch (error) {
            // console.error('Failed to fetch beats', error);
        }
    }

    async function loadMoreBeats(){
        // console.log($beatPagesFetched)
        if ($allBeatPagesFetched){
            // console.log('Already fetched all beat pages!')
            return
        }

        loadingNewBeats = true

        try {
            await fetchBeats(getNextBeatPageToFetch())
            loadingNewBeats = false

        } catch {
            console.log('an error fetching public beats...')
            loadingNewBeats = false
             
        }

    }

    async function retryBeatsFetch(){
        try {

            fetchBeatsAttempted.set(false)
            await fetchBeats()
        } catch {

        }
    }

</script>


{#if !$fetchBeatsAttempted}
    <DashboardLoader></DashboardLoader>
{:else}

    {#if $beatFetchError}
        <div class="containBeatPage">
            <FormError errorMessage={$beatFetchError} errorTitle={"Beat Fetch Error"} textAlign={"center"}></FormError>

            <div style="margin: auto; width:fit-content; margin-top: 20px;">
                <BoxButton buttonText={'Retry Fetch'} on:click={retryBeatsFetch}></BoxButton>
            </div>
        </div>

    {:else}

        {#if $beats.length >= 1}

            <div class="containBeatPage">

                <div class="goToAddButton">
                    <BoxButton buttonIcon={'add'} fullWidth={true} on:click={(e) => {goto('/portal/add-beat')}} buttonStyle={'stockButton'} buttonText={'Add Beat'}></BoxButton>
                </div>

                <div class="adminBeatGrid">
                    
                    {#each $beats as beat, i }
                        <div class="wrapBeatChild">
                            <AdminBeatListItem beat={beat} isEven={(i % 2 !== 0) ? true : false}></AdminBeatListItem>
                        </div>
                    {/each}
                </div>


                {#if !$allBeatPagesFetched}
                    <div style="margin: auto; width: fit-content; margin-top: 50px;">
                        {#if loadingNewBeats}
                            <div in:fade={{duration: 200}}>
                                <SpinLoader></SpinLoader>
                            </div>
                            {:else}
                            <div in:fade={{duration: 200}}>
                                <TightButton buttonText={'Fetch More'} on:click={loadMoreBeats}></TightButton>
                            </div>
                        {/if}
                    </div>
                {/if}

            </div>


        {:else}
            <AddTrackPointer></AddTrackPointer>
        {/if}
        
    {/if}




{/if}



