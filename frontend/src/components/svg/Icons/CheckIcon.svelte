<script>
    export let height = '50px';
    import { onMount } from 'svelte';
    export let color = '#f7f7f7';

    let uniqueId = '';

    onMount(() => {
        uniqueId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });
</script>

<svg
    id="{uniqueId}"
    viewBox="0 0 24 24"
    height={height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="{color}"
>
    <path
        d="M4 12.6111L8.92308 17.5L20 6.5"
        stroke="{color}"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
    />
</svg>
