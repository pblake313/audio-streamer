<script>
    export let height = '20px';
    import { onMount } from 'svelte';
    export let color = '#222222';

    let uniqueId = '';

    onMount(() => {
        // Generating a unique ID using timestamp and a random number
        uniqueId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });
</script>

<svg
    id="{uniqueId}"
    viewBox="-3 0 28 28"
    height={height}
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    fill="{color}"
    class="animated-svg"
>
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="Icon-Set-Filled" transform="translate(-419.000000, -571.000000)" fill="{color}">
                <path d="M440.415,583.554 L421.418,571.311 C420.291,570.704 419,570.767 419,572.946 L419,597.054 C419,599.046 420.385,599.36 421.418,598.689 L440.415,586.446 C441.197,585.647 441.197,584.353 440.415,583.554" id="play"></path>
            </g>
        </g>
    </g>
</svg>

<style>
    .animated-svg {
        transition: height 0.5s ease, fill 0.5s ease;
        display: block;
    }
</style>
