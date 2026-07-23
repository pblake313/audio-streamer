<script lang="ts">
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import {
        fileSizeTranslator,
        formatDate,
        formatTime,
        removeFileExtension,
    } from "../../helpers/formatters";
    import type { ConvertedFileDoc } from "../../lib/types/ConvertedFiles";
    import { pushNotification } from "../../stores/NotificationStore";
    import DownloadIcon from "../Icons/svg/DownloadIcon.svelte";
    import Loader from "../loaders/Loader.svelte";

    import "./ConvertedFileListItem.css";

    export let file: ConvertedFileDoc;

    let isDownloading: boolean = false;

    async function handleDownload() {
        try {
            if (isDownloading) return;
            isDownloading = true;

            const blob = await authorizedFetch<Blob>(
                `/secure/converter/download-converted-file/${file.id}`,
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `${removeFileExtension(file.filename)}.mp3`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);


        } catch (err: any) {
            const errMessage = err.message || "An unknown error has occurred.";
            pushNotification(
                errMessage,
                "Error",
                false,
                4000,
                "Download Error",
            );
        } finally {
            isDownloading = false;
        }
    }
</script>

<button
    type="button"
    class="cfli_button"
    on:click={handleDownload}
    disabled={isDownloading}
>
    <div class="cfli_text">
        <p class="cfli_filename">
            {removeFileExtension(file.filename)}
        </p>

        <p class="cfli_details">
            {fileSizeTranslator(file.mp3Bytes)}
            <span>•</span>
            Expires {formatDate(file.expiresAt)}
        </p>
    </div>

    <div class="cfli_download">
        {#if isDownloading}
            <Loader height={"24px"} />
        {:else}
            <DownloadIcon height={"24px"} />
        {/if}
    </div>
</button>