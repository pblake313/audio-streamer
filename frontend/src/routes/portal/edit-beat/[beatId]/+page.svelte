<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import EditBeatForm from '../../../../forms/EditBeatForm/EditBeatForm.svelte';
    import type { Beat } from '../../../../lib/types/Beats';
    import { beatToEdit, fetchSingleBeat, isFetchingBeatToEdit } from '../../../../stores/EditBeatStore';
    import DashboardLoader from '../../../../components/loaders/PageLoaders/DashboardLoader.svelte';
    import { goto } from '$app/navigation';


    // Get the beatId from the page store
    $: beatId = $page.params.beatId;

    let beatCopy: Beat | null = null
  
    // Check if the beatId exists in the adminBeats array on mount
    onMount(async () => {
        await fetchSingleBeat(beatId)

        if ($beatToEdit){
            beatCopy = $beatToEdit
        } else {
            console.log('no beat to edit... need to do something...')
            goto('/portal/manage-beats')
        }
  
    });


</script>


<svelte:head>
    <title>Edit Track - {beatCopy?.beatTitle || 'PATTSWAY'}</title>
</svelte:head>


{#if $isFetchingBeatToEdit}
    <DashboardLoader />
{:else}
    {#if beatCopy}   
        <EditBeatForm beatCopy={beatCopy}></EditBeatForm>
    {:else}
        <p>No Beat To edit... gotta return...</p>
    {/if}
{/if}


