<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import type { Beat } from '../../../../lib/types/Beats';
    import { beatToEdit, fetchSingleBeat, fetchSingleBeatError, isFetchingBeatToEdit } from '../../../../stores/EditBeatStore';
    import DashboardLoader from '../../../../components/loaders/PageLoaders/DashboardLoader.svelte';
    import { goto } from '$app/navigation';
    import EditBeatForm from '../../../../components/forms/EditBeatForm.svelte';
    import Loader from '../../../../components/loaders/Loader.svelte';
    import PageHeading from '../../../../components/page-components/PageHeading.svelte';


    // Get the beatId from the page store
    $: beatId = $page.params.beatId;

    let beatCopy: Beat | null = null
  
    onMount(async () => {
        const id = beatId;

        if (!id) {
            console.log("No beat ID");
            await goto("/portal/manage-beats");
            return;
        }

        await fetchSingleBeat(id);
    });

</script>



{#if $isFetchingBeatToEdit}
    <Loader loaderStyle={"loader_full"} text={"Fetching latest beat data."}/>
{:else if $fetchSingleBeatError}
    <PageHeading 
        title={"Fetch Beat Error"} 
        subtitle={$fetchSingleBeatError} 
        onButtonClick={() => {
            fetchSingleBeat(beatId || null)
        }}
        buttonText={"Retry"}
    />
{:else if $beatToEdit}
    <EditBeatForm beat={$beatToEdit}/>
{:else}
    <p>No beat to edit.</p>
{/if}


