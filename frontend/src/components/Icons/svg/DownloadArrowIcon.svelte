<script lang="ts">
    // arrow down into a tray; takes the text color unless one is passed
    export let height = "16px";
    export let color = "currentColor";
</script>

<svg
    {height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
>
    <path d="M12 4v11" />
    <path d="M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
</svg>
