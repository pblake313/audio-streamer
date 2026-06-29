

<script lang="ts">
    export let width = '50px'
    import { onMount } from 'svelte';

    let uniqueId = '';

    onMount(() => {
        // Generating a unique ID using timestamp and a random number
        uniqueId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });
</script>


<svg {width} id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 178 178">
  <defs>
    <style>
      .cls-1 {
        fill: #f7f7f7;
      }
    </style>
  </defs>
  <g id="Layer_1-2" data-name="Layer 1">
    <g>
      <path class="cls-1" d="M119.52,81.46c3.5-3.47,5.28-8.51,5.28-14.98,0-14.4-8.85-21.4-27.05-21.4h-32.54v42.8h32.54c10.08.11,17.39-2.07,21.77-6.42Z"/>
      <path class="cls-1" d="M160.73,0H17.27C7.73,0,0,7.73,0,17.27v143.45c0,9.54,7.73,17.27,17.27,17.27h143.45c9.54,0,17.27-7.73,17.27-17.27V17.27c0-9.54-7.73-17.27-17.27-17.27ZM135.1,94.2c-7.13,7.08-17.56,10.67-31,10.67-.17,0-.34,0-.51,0h-38.38v51.04h-20.38V28.09h58.78c26.42,0,41.58,13.99,41.58,38.38,0,11.75-3.39,21.08-10.08,27.72Z"/>
    </g>
  </g>
</svg>