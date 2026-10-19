<script lang="ts">

    import ConverterForm from '../../../components/forms/ConverterForm.svelte';
    import ConvertedFileList from '../../../components/lists/ConvertedFiles.svelte/ConvertedFileList.svelte';
import './ConverterPage.css'

</script>

<svelte:head>
    <title>File Converter</title>
</svelte:head>


<div class="converterPage_container">
    <header class="converter_topper">
        <p class="converter_eyebrow">Tools</p>
        <h2>File Converter</h2>
        <p class="converter_subtitle">
            Convert up to 20 WAV files (50 MB each) at a time into 320 kbps MP3s.
            Converted files are kept for two weeks.
        </p>
    </header>

    <section class="converter_section">
        <header class="converter_sectionHeader">
            <span class="converter_step">01</span>
            <div>
                <h5 class="converter_sectionTitle">Convert</h5>
                <p class="converter_sectionHint">Drop in WAV files, then convert them all at once.</p>
            </div>
        </header>

        <ConverterForm />
    </section>

    <section class="converter_section">
        <header class="converter_sectionHeader">
            <span class="converter_step">02</span>
            <div>
                <h5 class="converter_sectionTitle">Converted files</h5>
                <p class="converter_sectionHint">Click a file to download it as MP3.</p>
            </div>
        </header>

        <ConvertedFileList />
    </section>
</div>
