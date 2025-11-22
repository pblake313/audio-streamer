<script>
    export let height = '30px'
    import { onMount } from 'svelte';

let uniqueId = '';

onMount(() => {
    // Generating a unique ID using timestamp and a random number
    uniqueId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
});
</script>

<style>
    .flipIcon {
        transform: rotate(180deg);
        padding-top: 5px;
    }
</style>

<div class="flipIcon">
    <svg viewBox="0 0 24 24" id="{uniqueId}" height={height} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.8567 11.4931L20.4043 7.13548C21.071 6.75058 21.9043 7.23171 21.9043 8.00151L21.9043 17.0742C21.9043 17.844 21.071 18.3251 20.4043 17.9402L12.8567 13.5826L12.8567 17.0742C12.8567 17.844 12.0233 18.3251 11.3567 17.9402L3.49953 13.4039C2.83287 13.019 2.83287 12.0567 3.49953 11.6718L11.3567 7.13549C12.0233 6.75059 12.8567 7.23172 12.8567 8.00152L12.8567 11.4931Z" fill="#1b1b1b"></path>
        </g>
    </svg>
</div>
