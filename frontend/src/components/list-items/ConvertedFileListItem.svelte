<script lang="ts">
    import { fileSizeTranslator, formatDate, formatTime, removeFileExtension } from "../../helpers/formatters";
    import type { ConvertedFileDoc } from "../../lib/types/ConvertedFiles";
    import DownloadIcon from "../Icons/svg/DownloadIcon.svelte";
    import Loader from "../loaders/Loader.svelte";

    import './ConvertedFileListItem.css'

    export let file: ConvertedFileDoc
</script>



<button class="cfli_button">
    <div>
        <p class="cfli_filename">{removeFileExtension(file.filename)}</p>
        <p style="font-size: 10pt; padding-top: 3px">{fileSizeTranslator(file.mp3Bytes)} - Expires  {formatDate(file.expiresAt)}</p>
    </div>

    <div>
        <DownloadIcon height={"24px"}/>
        <!-- <Loader height={"24px"}/> -->
    </div>

</button>