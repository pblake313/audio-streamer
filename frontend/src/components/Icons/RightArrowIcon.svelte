<script lang="ts">
    export let height = '18px'    
    import { onMount } from 'svelte';
    export let color: string = '#222222'

    let uniqueId = '';

    onMount(() => {
        // Generating a unique ID using timestamp and a random number
        uniqueId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });
</script>



<svg id={uniqueId} {height} version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .puchipuchi_een{fill:#f7f7f7;} </style> <path class="puchipuchi_een" d="M20.414,26.414l9-9c0.781-0.781,0.781-2.047,0-2.828l-9-9c-0.781-0.781-2.047-0.781-2.828,0 s-0.781,2.047,0,2.828L23.172,14H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h19.172l-5.586,5.586c-0.781,0.781-0.781,2.047,0,2.828 S19.633,27.195,20.414,26.414z"></path> </g></svg>