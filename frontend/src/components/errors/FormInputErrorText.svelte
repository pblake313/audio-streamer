<script lang="ts">
    export let inputErrorText: string | null = `Enter 'inputErrorText' prop`
</script>


{#if inputErrorText}
    <p class="inputErrorText">{inputErrorText}</p>
{/if}

<style>
    .inputErrorText{
        color: var(--color-red);
        font-size: 11pt;
    }
</style>