<script lang="ts">
    import { onDestroy, tick } from "svelte";
    import "./ConverterForm.css";
    import AddIcon from "../Icons/svg/AddIcon.svelte";
    import BoxButton from "../buttons/BoxButton.svelte";
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";


    $: console.log(files)

    let files: File[] = [];
    let fileInput: HTMLInputElement;
    let errorElement: HTMLParagraphElement;

    let isDragging = false;
    let error: string | null = null;
    let errorTimeout: number | null = null;

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file
    const ERROR_DURATION = 6000;

    function clearError() {
        error = null;

        if (errorTimeout !== null) {
            window.clearTimeout(errorTimeout);
            errorTimeout = null;
        }
    }

    async function showError(message: string) {
        if (errorTimeout !== null) {
            window.clearTimeout(errorTimeout);
        }

        error = message;

        // Wait for the error element to render.
        await tick();

        errorElement?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        errorTimeout = window.setTimeout(() => {
            error = null;
            errorTimeout = null;
        }, ERROR_DURATION);
    }

    function addFiles(selectedFiles: FileList | File[]) {
        clearError();

        const validFiles: File[] = [];
        let latestError: string | null = null;

        for (const file of Array.from(selectedFiles)) {
            const isWav =
                file.type === "audio/wav" ||
                file.type === "audio/x-wav" ||
                file.name.toLowerCase().endsWith(".wav");

            if (!isWav) {
                latestError = `"${file.name}" is not a WAV file.`;
                continue;
            }

            if (file.size > MAX_FILE_SIZE) {
                latestError = `"${file.name}" is larger than 50 MB.`;
                continue;
            }

            const alreadyAdded = [...files, ...validFiles].some(
                (existingFile) =>
                    existingFile.name === file.name &&
                    existingFile.size === file.size &&
                    existingFile.lastModified === file.lastModified,
            );

            if (alreadyAdded) {
                latestError = `"${file.name}" has already been added.`;
                continue;
            }

            validFiles.push(file);
        }

        files = [...files, ...validFiles];

        if (latestError) {
            void showError(latestError);
        }
    }

    function handleFileInput(event: Event) {
        const input = event.currentTarget as HTMLInputElement;

        if (input.files?.length) {
            addFiles(input.files);
        }

        // Allows the same file to be selected again after removal.
        input.value = "";
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        isDragging = false;

        const droppedFiles = event.dataTransfer?.files;

        if (droppedFiles?.length) {
            addFiles(droppedFiles);
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        isDragging = true;

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "copy";
        }
    }

    function handleDragLeave(event: DragEvent) {
        const dropZone = event.currentTarget as HTMLElement;
        const nextElement = event.relatedTarget as Node | null;

        if (!nextElement || !dropZone.contains(nextElement)) {
            isDragging = false;
        }
    }

    function removeFile(index: number) {
        files = files.filter((_, fileIndex) => fileIndex !== index);
    }

    function clearFiles() {
        files = [];
        clearError();
    }

    function formatFileSize(bytes: number) {
        const megabytes = bytes / (1024 * 1024);

        return `${megabytes.toFixed(2)} MB`;
    }

    async function convertFiles() {

        try {
            const formData = new FormData();

            for (const file of files) {
                formData.append("wavFiles", file);
            }

            const response = await authorizedFetch('/secure/converter/wav-to-mp3', {
                method: "POST",
                body: formData,
            })

            console.log(response)

        } catch (error){
            console.log(error)
            
        } finally {

        }
    }

    onDestroy(() => {
        if (errorTimeout !== null) {
            window.clearTimeout(errorTimeout);
        }
    });
</script>

<div class="converter-uploader">
    <!-- hidden input -->
    <input
        bind:this={fileInput}
        class="converter-uploader__input"
        type="file"
        accept=".wav,audio/wav,audio/x-wav"
        multiple
        on:change={handleFileInput}
    />

    {#if files.length >= 1}
        <div class="converter-uploader__header">
            <h5>Selected Files ({files.length})</h5>

            <div class="conveterUploader_headerButtons">
                <BoxButton
                    on:click={() => fileInput.click()}
                    buttonText={"Add More"}
                    buttonIcon={"add"}
                    buttonStyle={"opacityIncrease"}
                    tightPad={true}
                />

                <BoxButton
                    buttonStyle={"glass"}
                    buttonText={"Clear All"}
                    on:click={clearFiles}
                    tightPad={true}
                />
            </div>
        </div>

        <div class="converter-uploader__files">
            {#each files as file, index (`${file.name}-${file.size}-${file.lastModified}`)}
                <div class="converter-uploader__file">
                    <div class="converter-uploader__file-info">
                        <p class="converter-uploader_filename">{file.name}</p>
                        <p style="font-size: 10pt;">
                            {formatFileSize(file.size)}
                        </p>
                    </div>

                    <BoxButton
                        on:click={() => {
                            removeFile(index);
                        }}
                        buttonText={null}
                        buttonIcon={"trash"}
                        iconColor={"#f7f7f7"}
                        tightPad={true}
                        buttonStyle={"opacityIncrease"}
                    />
                </div>
            {/each}
        </div>

        <div style="margin-top: 15px;">
            <BoxButton
                buttonText={"Convert Files"}
                on:click={convertFiles}
                fullWidth={true}
            />
        </div>

        {#if error}
            <p
                bind:this={errorElement}
                class="converter-uploader__error"
                role="alert"
                aria-live="assertive"
            >
                {error}
            </p>
        {/if}
    {:else}
        <button
            type="button"
            class="converter-uploader__dropzone"
            class:dragging={isDragging}
            on:click={() => fileInput.click()}
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
        >
            <AddIcon color={"f7f7f7"} />

            <h5>Select Files</h5>
            <p>Drag and drop or select your WAV files.</p>
        </button>

        {#if error}
            <p
                bind:this={errorElement}
                class="converter-uploader__error"
                role="alert"
                aria-live="assertive"
            >
                {error}
            </p>
        {/if}
    {/if}
</div>
