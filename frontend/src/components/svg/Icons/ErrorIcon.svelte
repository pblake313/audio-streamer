<script>
    export let height = '50px'    
    import { onMount } from 'svelte';

    let uniqueId = '';
    export let color = '#d63232'

    onMount(() => {
        // Generating a unique ID using timestamp and a random number
        uniqueId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });
</script>

<svg  id="{uniqueId}" viewBox="0 0 24 24" height={height} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="12" cy="12" r="10" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle> <path d="M5 19L19 5" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>