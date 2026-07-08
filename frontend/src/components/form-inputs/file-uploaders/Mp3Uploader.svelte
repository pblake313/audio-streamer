<script lang="ts">
    import { onDestroy } from "svelte";
    import BoxButton from "../../buttons/BoxButton.svelte";
    import AudioVisualizer from "../../misc/AudioVisualizer.svelte";
    import FormInputErrorText from "../../errors/FormInputErrorText.svelte";
    import AddIcon from "../../Icons/svg/AddIcon.svelte";
    import "./Mp3Uploader.css";

    let fileInput: HTMLInputElement | null = null;

    export let mp3Url: string | null = null;
    export let fileName: string | null = null;

    export let inputError: string | null = null;

    export let label: string = `Enter 'label'`;
    export let maxFileSizeMB: number = 10;
    export let file: File | null = null;
    export let id: string | null = null;
    export let dropZoneClass: string = "";
    export let showInputError: boolean = true;
    export let dropzoneLabel: string = "Add MP3";

    export let mp3Uploaded:
        | ((payload: { mp3Url: string; file: File }) => void)
        | undefined;

    export let clearInput: (() => void) | undefined;

    let dragActive = false;
    let zoneEl: HTMLDivElement | null = null;

    let internalError: string | null = null;
    let errorTimer: ReturnType<typeof setTimeout> | null = null;

    $: combinedError = internalError ?? inputError;

    const genId = () =>
        `mp3-uploader-${
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        }`;

    let inputId = id || genId();

    $: if (id && id !== inputId) {
        inputId = id;
    }

    const acceptedTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/x-mpeg",
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
        if (mp3Url?.startsWith("blob:")) {
            URL.revokeObjectURL(mp3Url);
        }
    }

    function clearCurrentFile() {
        if (fileInput) {
            fileInput.value = "";
        }

        revokeBlob();

        mp3Url = null;
        fileName = null;
        file = null;

        clearInput?.();
    }

    function isValidMp3(picked: File) {
        return acceptedTypes.includes(picked.type) || picked.name.toLowerCase().endsWith(".mp3");
    }

    function handleFiles(files: FileList | File[]) {
        const picked = Array.isArray(files) ? files[0] : files.item(0);
        if (!picked) return;

        internalError = null;

        if (!isValidMp3(picked)) {
            setTemporaryError("Please upload an MP3 file.");
            return;
        }

        const maxBytes = maxFileSizeMB * 1024 * 1024;

        if (picked.size > maxBytes) {
            setTemporaryError(
                `Max file size is ${maxFileSizeMB} MB. Selected file is ${(
                    picked.size /
                    (1024 * 1024)
                ).toFixed(1)} MB.`,
            );

            clearCurrentFile();
            return;
        }

        file = picked;
        fileName = picked.name;

        revokeBlob();

        mp3Url = URL.createObjectURL(picked);
        internalError = null;

        mp3Uploaded?.({ mp3Url, file });
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

    function uploadFile() {
        fileInput?.click();
    }

    function onZoneClick(event: MouseEvent) {
        const target = event.target as HTMLElement;

        if (
            target.closest(
                ".mp3Up-noOpen, .no-open, button, a, input, textarea, select",
            )
        ) {
            return;
        }

        uploadFile();
    }

    function onKeyOpen(event: KeyboardEvent) {
        if (event.currentTarget !== event.target) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            uploadFile();
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

    function formatFileType(type: string | null | undefined) {
        if (!type) return "MP3";

        if (type.includes("mpeg") || type.includes("mp3")) {
            return "MP3";
        }

        return type.replace("audio/", "").toUpperCase();
    }

    onDestroy(() => {
        if (errorTimer) {
            clearTimeout(errorTimer);
        }

        revokeBlob();
    });
</script>

<div class="mp3Up-labelRow">
    <label class="mp3Up-label" for={inputId}>{label}</label>

    <p class="mp3Up-maxSize">{maxFileSizeMB}MB</p>
</div>

<div
    bind:this={zoneEl}
    class={`mp3Up-dropZone ${dropZoneClass} ${dragActive ? "mp3Up-dragActive" : ""}`}
    class:mp3Up-hasFile={!!fileName}
    class:mp3Up-error={!!combinedError && !fileName}
    role="button"
    tabindex="0"
    aria-controls={inputId}
    aria-invalid={!!combinedError}
    on:click={onZoneClick}
    on:keydown={onKeyOpen}
    on:dragover={onDragOver}
    on:dragenter={onDragEnter}
    on:dragleave={onDragLeave}
    on:drop={onDrop}
>
    {#if fileName}
        <div class="mp3Up-selectedCard">
            <div class="mp3Up-selectedInfo">
                <p class="mp3Up-selectedEyebrow">Selected audio</p>

                <p class="mp3Up-fileName">{fileName}</p>

                <div class="mp3Up-fileMeta">
                    {#if formatFileSize(file?.size)}
                        <span>{formatFileSize(file?.size)}</span>
                    {/if}

                    <span>{formatFileType(file?.type)}</span>
                </div>
            </div>

            <div class="mp3Up-removeBtn mp3Up-noOpen">
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

        {#if mp3Url}
            {#key mp3Url}
                <div
                    class="mp3Up-noOpen mp3Up-visualizerWrap"
                    role="button"
                    tabindex="-1"
                    on:click|stopPropagation
                    on:mousedown|stopPropagation
                    on:pointerdown|stopPropagation
                    on:keydown|stopPropagation
                    on:touchstart|stopPropagation
                >
                    <AudioVisualizer showTime={false} height={30} audioUrl={mp3Url} />
                </div>
            {/key}
        {/if}
    {:else}
        <div class="mp3Up-emptyState">
            <AddIcon color={"f7f7f7"} height="20px" />

            <p class="mp3Up-emptyTitle">{dropzoneLabel}</p>

            <p class="mp3Up-fileTypes">Accepted: MP3</p>
        </div>
    {/if}
</div>

<input
    id={inputId}
    type="file"
    bind:this={fileInput}
    accept=".mp3,audio/mpeg,audio/mp3,audio/x-mpeg"
    on:change={handleFileChange}
    aria-invalid={!!combinedError}
    style="display: none"
/>

{#if showInputError && combinedError}
    <div class="mp3Up-errorText">
        <FormInputErrorText inputErrorText={combinedError} />
    </div>
{/if}