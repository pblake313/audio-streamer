<script lang="ts">
    import { cycleRepeatMode, repeatMode } from "../../../stores/AudioPlayerStore";
    import "./PlaybackModeButton.css";

    export let size = "36px";
    export let iconHeight = "22px";

    $: label =
        $repeatMode === "one" ? "Repeat one"
        : $repeatMode === "all" ? "Repeat all"
        : "Repeat off";
</script>

<button
    type="button"
    class="pmb_button"
    class:pmb_active={$repeatMode !== "off"}
    style="width: calc({size} * 1.2); height: {size};"
    aria-label="Repeat: {label}"
    title={label}
    on:click={cycleRepeatMode}
>
    <svg
        height={iconHeight}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
        <path d="M7 22l-4-4 4-4" />
        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>

    {#if $repeatMode === "one"}
        <span class="pmb_badge">1</span>
    {/if}
</button>
