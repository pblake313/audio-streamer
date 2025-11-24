<script lang="ts">
    import FileLoader from "../loaders/FileLoader.svelte";
import FileWaiting from "../loaders/FileWaiting.svelte";
import SuccessIcon from "../Icons/svg/SuccessIcon.svelte";
    import './BackendStatusBlock.css'

    export let title = 'Enter Title';
    export let subtitle: string | null = null;
    export let status: 'Waiting' | 'Uploading' | 'Upload Success' | null = null;
</script>

{#if status === 'Uploading' || status === 'Upload Success' || status === 'Waiting'}
    <div class="backendBlockWrap">
        <div class="loadText">
            <p><b>{title}</b></p>
            <p class="subBackText">{subtitle ? subtitle : status}</p>
        </div>

        <div class="holdLoader">
            <div class="wrapLo">
                {#if status === 'Waiting'}
                    <FileWaiting></FileWaiting>
                {:else if status === 'Uploading'}
                    <FileLoader></FileLoader> 
                {:else if status === 'Upload Success'}
                    <SuccessIcon></SuccessIcon>
                {/if}
            </div>
        </div>
    </div>
{/if}