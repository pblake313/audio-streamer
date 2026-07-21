<script lang="ts">
    import { onMount } from "svelte";
    import {
        allFileBatchesFetched,
        convertedFiles,
        fetchFileDocsByPage,
        isFetchingFiles,
        isFetchingMoreFiles,
        oneSuccessfulFileBatchFetched,
    } from "../../../stores/ConvertedFilesStore";
    import Loader from "../../loaders/Loader.svelte";

    import "./ConvertedFileList.css";
    import ConvertedFileListItem from "../../list-items/ConvertedFileListItem.svelte";
    import BoxButton from "../../buttons/BoxButton.svelte";

    onMount(() => {
        if (!$oneSuccessfulFileBatchFetched) {
            fetchFileDocsByPage();
        }
    });

</script>

<div class="cfl_container">
    {#if $isFetchingFiles}
        <Loader text={"Fetching recently converted files."} />
    {:else if $convertedFiles.length >= 1}
        <div class="cfl_listContainer">
            {#each $convertedFiles as file}
                <ConvertedFileListItem {file} />
            {/each}
        </div>

        <div class="cfl_fetchMore">
            {#if $allFileBatchesFetched}
                <p style="opacity: .7;">All files fetched.</p>
            {:else}
                <BoxButton
                    buttonStyle={"opacityIncrease"}
                    tightPad={true}
                    isDisabled={$isFetchingMoreFiles || $isFetchingFiles}
                    buttonText={$isFetchingMoreFiles || $isFetchingFiles
                        ? null
                        : "Fetch More"}
                    on:click={fetchFileDocsByPage}
                    buttonIcon={$isFetchingMoreFiles || $isFetchingFiles
                        ? "loading"
                        : null}
                />
            {/if}
        </div>
    {:else}
        <p style="text-align: center; opacity: .7;">
            No recent conversions. <br /> Files are automatically deleted after 2
            weeks.
        </p>
    {/if}
</div>
