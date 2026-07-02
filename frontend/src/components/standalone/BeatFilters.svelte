<script lang="ts">
    import { artistFilter, clearArtistFilter, clearMoodFilter, clearTagFilter, moodFilter, tagFilter } from "../../stores/AudioPlayer/BeatsStore";

</script>



{#if $moodFilter.length >= 1}
    <button on:click={clearMoodFilter}>
        {#each $moodFilter as mood}
            <p>{mood}</p>
        {/each}
    </button>
{/if}

{#if $tagFilter.length >= 1}
    <button on:click={clearTagFilter}>
        {#each $tagFilter as tag}
            <p>{tag}</p>
        {/each}
    </button>
{/if}
{#if $artistFilter.length >= 1}
    <button on:click={clearArtistFilter}>
        {#each $artistFilter as tag}
            <p>{tag}</p>
        {/each}
    </button>
{/if}

