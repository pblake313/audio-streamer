<script lang="ts">
    import { goto } from "$app/navigation";
    import PageHeading from "./PageHeading.svelte";

</script>

<PageHeading 
    onButtonClick={() => {goto('/portal/add-beat')}}
    buttonText={'Add Track'}
    title={'Add a track!'}
    subtitle={'You dont have any tracks yet! When you add a track or two, you will be able to view and play them from here!'}
/>