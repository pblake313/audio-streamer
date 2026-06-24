<script lang="ts">
    import { onMount } from 'svelte';

    export let height = '16px';
    export let color = '#222222';

    let uniqueId = '';

    onMount(() => {
        uniqueId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });
</script>

<svg 
    xmlns="http://www.w3.org/2000/svg" 
    id={uniqueId} 
    width={height} 
    height={height} 
    fill={color}
    viewBox="0 0 16 16"
    class="icon">
    <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>
</svg>

<style>
    .icon {
        display: block;
    }
</style>