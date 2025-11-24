<script lang="ts">
  export let height = '18px';    
  export let color: string = '#222222';

  let uniqueId = '';

  import { onMount } from 'svelte';

  onMount(() => {
    uniqueId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  });
</script>

<svg
  id={uniqueId}
  {height}
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 32 32"
  fill={color}           
>
  <path
    d="M20.414,26.414l9-9c0.781-0.781,0.781-2.047,0-2.828l-9-9c-0.781-0.781-2.047-0.781-2.828,0
       s-0.781,2.047,0,2.828L23.172,14H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h19.172l-5.586,5.586c-0.781,0.781-0.781,2.047,0,2.828
       S19.633,27.195,20.414,26.414z"
  />
</svg>
