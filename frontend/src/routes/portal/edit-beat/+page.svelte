<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    onMount(() => {
        goto('/portal')
    })
</script>


<!-- if we dont get a beat id, then just route back to the portal. -->