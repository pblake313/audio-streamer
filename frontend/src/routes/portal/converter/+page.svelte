<script lang="ts">

    import ConverterForm from '../../../components/forms/ConverterForm.svelte';
    import ConvertedFileList from '../../../components/lists/ConvertedFiles.svelte/ConvertedFileList.svelte';
import './ConverterPage.css'

</script>


<div class="converterPage_container">

    <div class="converter_topper">
        <h2>File Converter</h2>
        <p class="mbp_subtitle">A WAV to MP3 file converter.</p>
    </div>

    <ConverterForm />

    <div class="converter_filesList">
        <ConvertedFileList />
    </div>

</div>
