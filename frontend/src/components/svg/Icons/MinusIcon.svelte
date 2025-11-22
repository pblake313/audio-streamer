<script>
    export let height = '15px'
    export let color = 'ffffff'
    import { onMount } from 'svelte';

    let uniqueId = '';

    onMount(() => {
        // Generating a unique ID using timestamp and a random number
        uniqueId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });
</script>

<svg viewBox="0 0 24 24"  id="{uniqueId}" height={height} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6 12L18 12" stroke="#{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>