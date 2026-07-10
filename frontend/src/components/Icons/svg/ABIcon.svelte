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



<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 407 239.55"
    aria-hidden="true"
    style:height={height}
    style:color
>
    <g fill="currentColor">
        <path
            d="M272.76,36.54h61.4c14.7,0,34.85,0,44.81,6.16,11.14,6.64,19.91,18.49,19.91,35.32,0,18.02-9.25,31.53-25.13,37.93v.47c20.86,4.5,32.24,19.91,32.24,40.78,0,24.66-18.02,48.6-51.45,48.6h-81.79V36.54ZM295.29,109.32h45.04c25.6,0,36.04-9.01,36.04-27.03,0-23.71-16.36-26.79-36.04-26.79h-45.04v53.82ZM295.29,186.85h56.42c19.68,0,31.77-11.62,31.77-30.35,0-22.05-17.78-28.21-36.75-28.21h-51.45v58.56Z"
        />

        <path
            d="M67.61,36.54h24.89l66.14,169.27h-24.89l-18.49-50.97H43.66l-18.97,50.97H1.46L67.61,36.54ZM50.78,135.87h57.37l-28.21-78.95h-.47l-28.69,78.95Z"
        />

        <path d="M200.99,1h16.15v237.55h-16.15V1Z" />
    </g>
</svg>

<style>
    svg {
        display: block;
        width: auto;
        flex-shrink: 0;
    }
</style>