<script lang="ts">

    export let height = '14px'
    import { onMount } from 'svelte';

    export let color = '#f7f7f7'

    let uniqueId = '';

    onMount(() => {
        // Generating a unique ID using timestamp and a random number
        uniqueId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });

</script>


<svg id={uniqueId} {height} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="{color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="m5.75 8.25-3 3 3 3m7.5-3h-10.5m7.5-9.5l3 3-3 3m-7.5-3h10.5"></path> </g></svg>