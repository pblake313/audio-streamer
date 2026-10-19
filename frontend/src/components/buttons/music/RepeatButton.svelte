<script lang="ts">
    import { loopTrack, toggleLoopTrack } from "../../../stores/AudioPlayerStore";
    import "./PlaybackModeButton.css";

    export let size = "36px";
    export let iconHeight = "22px";

    // on: repeat this track. off: keep playing through the list.
    $: label = $loopTrack ? "Loop this track: on" : "Loop this track: off";
</script>

<button
    type="button"
    class="pmb_button"
    class:pmb_active={$loopTrack}
    style="width: calc({size} * 1.2); height: {size};"
    aria-label="Loop this track"
    aria-pressed={$loopTrack}
    title={label}
    on:click={toggleLoopTrack}
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

</button>
