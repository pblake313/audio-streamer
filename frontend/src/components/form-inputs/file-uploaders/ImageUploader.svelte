<script lang="ts">
    import { onDestroy } from "svelte";
    import BoxButton from "../../buttons/BoxButton.svelte";
    import FormInputErrorText from "../../errors/FormInputErrorText.svelte";
    import "./ImageUploader.css";
    import AddIcon from "../../Icons/svg/AddIcon.svelte";

    export let imageUrl: string | null = null;
    export let fileName: string | null = null;
    export let inputError: string | null = null;
    export let label: string = `Enter 'label'`;
    export let showInputError: boolean = true;
    export let maxFileSizeMB: number = 5;
    export let id: string | null = null;
    export let dropZoneClass: string = "";
    export let dropzoneLabel: string = "Add Image";

    export let selectedFile: File | null = null;

    export let fileUploaded:
        | ((payload: { imageUrl: string; file: File }) => void)
        | undefined;

    export let clearInput: (() => void) | undefined;

    let fileInput: HTMLInputElement | null = null;
    let zoneEl: HTMLDivElement | null = null;
    let dragActive = false;

    let internalError: string | null = null;
    let errorTimer: ReturnType<typeof setTimeout> | null = null;

    $: combinedError = internalError ?? inputError;

    const genId = () =>
        `image-uploader-${
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        }`;

    let inputId = id || genId();

    $: if (id && id !== inputId) {
        inputId = id;
    }

    const acceptedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
    ];

    function setTemporaryError(message: string) {
        internalError = message;

        if (errorTimer) {
            clearTimeout(errorTimer);
        }

        errorTimer = setTimeout(() => {
            internalError = null;
            errorTimer = null;
        }, 3000);
    }

    function revokeBlob() {
        if (imageUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(imageUrl);
        }
    }

    function clearCurrentFile() {
        if (fileInput) {
            fileInput.value = "";
        }

        revokeBlob();

        imageUrl = null;
        fileName = null;
        selectedFile = null;

        clearInput?.();
    }

    function handleFiles(files: FileList | File[]) {
        const file = Array.isArray(files) ? files[0] : files.item(0);
        if (!file) return;

        internalError = null;

        if (!acceptedTypes.includes(file.type)) {
            setTemporaryError("Please upload a JPEG, PNG, WEBP, or JPG file.");
            return;
        }

        const maxBytes = maxFileSizeMB * 1024 * 1024;

        if (file.size > maxBytes) {
            setTemporaryError(
                `Max file size is ${maxFileSizeMB} MB. Selected file is ${(
                    file.size /
                    (1024 * 1024)
                ).toFixed(1)} MB.`,
            );

            clearCurrentFile();
            return;
        }

        selectedFile = file;
        fileName = file.name;

        revokeBlob();

        imageUrl = URL.createObjectURL(file);
        internalError = null;

        fileUploaded?.({ imageUrl, file });
    }

    function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;

        if (target.files?.length) {
            handleFiles(target.files);
        }
    }

    function resetInput() {
        clearCurrentFile();
        internalError = null;
    }

    function onDragOver(event: DragEvent) {
        event.preventDefault();
        dragActive = true;
    }

    function onDragEnter(event: DragEvent) {
        event.preventDefault();
        dragActive = true;
    }

    function onDragLeave(event: DragEvent) {
        if (event.currentTarget === event.target) {
            dragActive = false;
        }
    }

    function onDrop(event: DragEvent) {
        event.preventDefault();
        dragActive = false;

        if (event.dataTransfer?.files?.length) {
            handleFiles(event.dataTransfer.files);
        }
    }

    function openPicker() {
        fileInput?.click();
    }

    function onZoneClick(event: MouseEvent) {
        const target = event.target as HTMLElement;

        if (
            target.closest(
                ".imgUp-noOpen, button, a, input, textarea, select",
            )
        ) {
            return;
        }

        openPicker();
    }

    function onKeyOpen(event: KeyboardEvent) {
        if (event.currentTarget !== event.target) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
        }
    }

    function formatFileSize(size: number | null | undefined) {
        if (!size) return null;

        const mb = size / (1024 * 1024);

        if (mb >= 1) {
            return `${mb.toFixed(1)} MB`;
        }

        return `${(size / 1024).toFixed(0)} KB`;
    }

    onDestroy(() => {
        if (errorTimer) {
            clearTimeout(errorTimer);
        }

        revokeBlob();
    });
</script>

<div class="imgUp-labelRow">
    <label class="imgUp-label" for={inputId}>{label}</label>

    <p class="imgUp-maxSize">{maxFileSizeMB}MB</p>
</div>

<div
    bind:this={zoneEl}
    class={`imgUp-dropZone ${dropZoneClass} ${dragActive ? "imgUp-dragActive" : ""}`}
    class:imgUp-hasFile={!!fileName}
    class:imgUp-error={!!combinedError && !fileName}
    role="button"
    tabindex="0"
    aria-controls={inputId}
    on:click={onZoneClick}
    on:keydown={onKeyOpen}
    on:dragover={onDragOver}
    on:dragenter={onDragEnter}
    on:dragleave={onDragLeave}
    on:drop={onDrop}
>
    {#if fileName}
        <div class="imgUp-selectedCard">
            <div class="imgUp-selectedInfo">
                <p class="imgUp-selectedEyebrow">Selected image</p>

                <p class="imgUp-fileName">{fileName}</p>

                <div class="imgUp-fileMeta">
                    {#if formatFileSize(selectedFile?.size)}
                        <span>{formatFileSize(selectedFile?.size)}</span>
                    {/if}

                    {#if selectedFile?.type}
                        <span>{selectedFile.type.replace("image/", "").toUpperCase()}</span>
                    {/if}
                </div>
            </div>

            {#if imageUrl}
                <div class="imgUp-previewWrap imgUp-noOpen">
                    <img
                        class="imgUp-preview"
                        src={imageUrl}
                        alt="Selected upload preview"
                    />
                </div>
            {/if}

            <div class="imgUp-removeBtn imgUp-noOpen">
                <BoxButton
                    on:click={resetInput}
                    tightPad={true}
                    fullWidth={true}
                    buttonIcon={"trash"}
                    buttonText={null}
                    buttonStyle={"clear"}
                    iconColor={"#f7f7f7"}
                />
            </div>
        </div>
    {:else}
        <div class="imgUp-emptyState">

            <AddIcon color={"f7f7f7"} height="20px"/>
            <p class="imgUp-emptyTitle">{dropzoneLabel}</p>

            <p class="imgUp-fileTypes">Accepted: JPEG / PNG / WEBP / JPG</p>
        </div>
    {/if}
</div>

<input
    id={inputId}
    type="file"
    bind:this={fileInput}
    accept="image/jpeg, image/png, image/jpg, image/webp"
    on:change={handleFileChange}
    aria-invalid={!!combinedError}
    style="display: none"
/>

{#if showInputError && combinedError}
    <div class="imgUp-errorText">
        <FormInputErrorText inputErrorText={combinedError} />
    </div>
{/if}