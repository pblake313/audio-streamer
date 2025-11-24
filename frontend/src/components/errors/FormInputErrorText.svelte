<script lang="ts">
    export let inputErrorText: string | null = `Enter 'inputErrorText' prop`
</script>


{#if inputErrorText}
    <p class="inputErrorText">{inputErrorText}</p>
{/if}

<style>
    .inputErrorText{
        color: #c30d0d;
        font-size: 11pt;
    }
</style>