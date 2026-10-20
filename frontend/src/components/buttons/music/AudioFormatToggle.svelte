<script lang="ts">
    import "./AudioFormatToggle.css";
    import type { AudioFormat } from "../../../stores/AudioFormatStore";

    // formats the track(s) have, the one playing, and what switching does
    export let available: AudioFormat[] = [];
    export let active: AudioFormat | null = null;
    export let onSelect: (format: AudioFormat) => void = () => {};

    const formats: AudioFormat[] = ["wav", "mp3"];

    $: next = active === "wav" ? "mp3" : "wav";
</script>

{#if available.length > 1}
    <!-- both files: clicking anywhere on the pill flips WAV <-> MP3 -->
    <button
        type="button"
        class="aft_toggle"
        aria-label={`Playing the ${(active ?? "wav").toUpperCase()}. Switch to the ${next.toUpperCase()}`}
        title={`Switch to the ${next.toUpperCase()}`}
        on:click={() => onSelect(next)}
    >
        {#each formats as format}
            <span
                class="aft_option"
                class:aft_active={active === format}
                aria-hidden="true"
            >
                {format}
            </span>
        {/each}
    </button>
{:else if active}
    <!-- one file: just say which -->
    <span
        class="aft_single"
        title={`Only a ${active.toUpperCase()} is uploaded for this track`}
    >
        {active}
    </span>
{/if}
