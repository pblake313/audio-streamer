<script lang="ts">
    import { onDestroy, onMount, tick } from "svelte";

    import "./ConverterForm.css";

    import AddIcon from "../Icons/svg/AddIcon.svelte";
    import BoxButton from "../buttons/BoxButton.svelte";
    import Loader from "../loaders/Loader.svelte";

    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import { getSocket } from "../../stores/socketStore";

    import {
        fileSizeTranslator,
        removeFileExtension,
    } from "../../helpers/formatters";

    import type { Socket } from "socket.io-client";
    import { upsertConvertedFile } from "../../stores/ConvertedFilesStore";
    import ConfettiAnimation from "../misc/ConfettiAnimation.svelte";
    import FormError from "../errors/FormError.svelte";

    type ConversionStatus =
        | "queued"
        | "converting"
        | "storing"
        | "saving"
        | "complete"
        | "error";

    interface SelectedFile {
        id: string;
        file: File;
        progress: number;
        status: ConversionStatus;
        outputFilename: string | null;
        error: string | null;
    }

    /*
     * This represents the Firestore document returned
     * by the backend after a conversion succeeds.
     *
     * createdAt and expiresAt are unknown here because
     * Firebase Timestamp values are serialized through
     * Socket.IO before reaching the browser.
     */
    interface ConvertedFileDoc {
        id: string;
        clientId: string;
        createdAt: Date;
        expiresAt: Date;
        filename: string;
        mp3Bytes: number;
        originalBytes: number;
        originalMime: string;
        originalName: string;
        storagePath: string;
    }

    interface ConversionProgressEvent {
        id: string;
        filename: string;
        percent: number;
        status: ConversionStatus;
        outputFilename?: string;
        message?: string;
        fileDoc?: ConvertedFileDoc;
    }

    let isConverting = false;

    let socket: Socket | null = null;

    let files: SelectedFile[] = [];

    let fileInput: HTMLInputElement;
    let errorElement: HTMLParagraphElement;

    let isDragging = false;

    let showConfetti = false;
    let confettiTimeout: number | null = null;

    const CONFETTI_DURATION = 7000;

    let error: string | null = null;
    let errorTimeout: number | null = null;

    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    const ERROR_DURATION = 6000;

    onMount(() => {
        void initializeSocket();
    });

    async function initializeSocket() {
        const io = await getSocket();

        socket = io;

        /*
         * Prevent duplicate listeners if this component
         * initializes the same socket more than once.
         */
        socket?.off("conversionProgress", handleConversionProgress);

        socket?.on("conversionProgress", handleConversionProgress);
    }

    function handleConversionProgress(data: ConversionProgressEvent) {
        /*
         * The backend only sends complete after:
         *
         * 1. FFmpeg conversion succeeds.
         * 2. The MP3 is uploaded to Firebase Storage.
         * 3. The Firestore document is created.
         */
        if (data.status === "complete") {
            if (data.fileDoc) {
                const convertedFile: ConvertedFileDoc = {
                    ...data.fileDoc,
                };

                // console.log("Created converted file document:", convertedFile);

                upsertConvertedFile(convertedFile);
            }

            files = files.filter((selectedFile) => selectedFile.id !== data.id);

            return;
        }

        updateFile(data.id, {
            progress: Math.max(0, Math.min(100, data.percent)),
            status: data.status,
            outputFilename: data.outputFilename ?? undefined,
            error:
                data.status === "error"
                    ? (data.message ?? "Conversion failed.")
                    : null,
        });
    }

    function updateFile(id: string, updates: Partial<SelectedFile>) {
        files = files.map((selectedFile) => {
            if (selectedFile.id !== id) {
                return selectedFile;
            }

            return {
                ...selectedFile,
                ...updates,
            };
        });
    }

    async function runConfetti() {
        if (confettiTimeout !== null) {
            window.clearTimeout(confettiTimeout);
            confettiTimeout = null;
        }

        /*
         * Temporarily unmount the component so the animation
         * restarts on every successful conversion request.
         */
        showConfetti = false;

        await tick();

        showConfetti = true;

        confettiTimeout = window.setTimeout(() => {
            showConfetti = false;
            confettiTimeout = null;
        }, CONFETTI_DURATION);
    }

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

        const validFiles: SelectedFile[] = [];
        let latestError: string | null = null;

        for (const file of Array.from(selectedFiles)) {
            const isWav =
                file.type === "audio/wav" ||
                file.type === "audio/x-wav" ||
                file.type === "audio/wave" ||
                file.type === "audio/vnd.wave" ||
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
                    existingFile.file.name === file.name &&
                    existingFile.file.size === file.size &&
                    existingFile.file.lastModified === file.lastModified,
            );

            if (alreadyAdded) {
                latestError = `"${file.name}" has already been added.`;

                continue;
            }

            validFiles.push({
                id: crypto.randomUUID(),
                file,
                progress: 0,
                status: "queued",
                outputFilename: null,
                error: null,
            });
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

    function removeFile(id: string) {
        files = files.filter((selectedFile) => selectedFile.id !== id);
    }

    function clearFiles() {
        files = [];
        clearError();
    }

    async function convertFiles() {
        if (isConverting || files.length === 0) {
            return;
        }

        try {
            clearError();

            isConverting = true;

            const io = await getSocket();
            const socketId = io.id;

            if (!socketId) {
                throw new Error(
                    "No frontend socket ID exists. One is required to convert.",
                );
            }

            /*
             * Reset all rows before starting
             * a new conversion attempt.
             */
            files = files.map((selectedFile) => ({
                ...selectedFile,
                progress: 0,
                status: "queued" as const,
                outputFilename: null,
                error: null,
            }));

            const formData = new FormData();

            formData.append("socketId", socketId);

            /*
             * wavFiles and clientIds use matching
             * array positions.
             */
            for (const selectedFile of files) {
                formData.append("wavFiles", selectedFile.file);

                formData.append("clientIds", selectedFile.id);
            }

            await authorizedFetch("/secure/converter/wav-to-mp3", {
                method: "POST",
                body: formData,
            });

            await runConfetti();
        } catch (caughtError: unknown) {
            console.error(caughtError);

            let message = "Could not convert the selected files.";

            if (caughtError instanceof Error) {
                message = caughtError.message;
            } else if (
                typeof caughtError === "object" &&
                caughtError !== null &&
                "message" in caughtError &&
                typeof caughtError.message === "string"
            ) {
                message = caughtError.message;
            }

            /*
             * Completed rows were already removed.
             * Only remaining rows are marked as errors.
             */
            files = files.map((selectedFile) => {
                if (selectedFile.status === "error") {
                    return selectedFile;
                }

                return {
                    ...selectedFile,
                    status: "error" as const,
                    error: message,
                };
            });

            await showError(message);
        } finally {
            isConverting = false;
        }
    }

    function getStatusText(selectedFile: SelectedFile): string {
        switch (selectedFile.status) {
            case "queued":
                return isConverting ? "Waiting" : "Ready";

            case "converting":
                return "Converting WAV to MP3";

            case "storing":
                return "Uploading MP3 to storage";

            case "saving":
                return "Saving conversion";

            /*
             * A completed file is immediately removed,
             * so this should not normally render.
             */
            case "complete":
                return "Conversion complete";

            case "error":
                return selectedFile.error ?? "Conversion failed";
        }
    }

    onDestroy(() => {
        socket?.off("conversionProgress", handleConversionProgress);

        if (errorTimeout !== null) {
            window.clearTimeout(errorTimeout);
        }
    });
</script>

{#if showConfetti}
    <div class="converter_confetti">
        <ConfettiAnimation />
    </div>
{/if}

<div class="converter-uploader">
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
            <h5 class="converter-uploader_title"> Selected Files ({files.length})</h5>

            <div class="conveterUploader_headerButtons">
                <BoxButton
                    on:click={() => fileInput.click()}
                    buttonText={"Add More"}
                    buttonIcon={"add"}
                    buttonStyle={"opacityIncrease"}
                    tightPad={true}
                    isDisabled={isConverting}
                />

                <BoxButton
                    buttonStyle={"glass"}
                    buttonText={"Clear All"}
                    on:click={clearFiles}
                    tightPad={true}
                    isDisabled={isConverting}
                />
            </div>
        </div>

        <div class="converter-uploader__files">
            {#each files as selectedFile (selectedFile.id)}
                <div class="converter-uploader__file">
                    <div class="converter-uploader__file-info">
                        <p class="converter-uploader_filename">
                            {removeFileExtension(selectedFile.file.name)}
                        </p>

                        <p class="converter-uploader__file-size">
                            {fileSizeTranslator(selectedFile.file.size)}
                        </p>

                        {#if isConverting}
                            <div class="converter-uploader__progress-header">
                                <p
                                    class:error={selectedFile.status ===
                                        "error"}
                                >
                                    {getStatusText(selectedFile)}
                                </p>

                                <p style="font-size: 10pt;">
                                    {selectedFile.progress}%
                                </p>
                            </div>

                            <div
                                class="converter-uploader__progress"
                                role="progressbar"
                                aria-label={`Conversion progress for ${selectedFile.file.name}`}
                                aria-valuemin="0"
                                aria-valuemax="100"
                                aria-valuenow={selectedFile.progress}
                            >
                                <div
                                    class="converter-uploader__progress-fill"
                                    class:is-error={selectedFile.status ===
                                        "error"}
                                    style={`width: ${selectedFile.progress}%`}
                                ></div>
                            </div>
                        {/if}
                    </div>

                    {#if !isConverting}
                        <BoxButton
                            on:click={() => removeFile(selectedFile.id)}
                            buttonText={null}
                            buttonIcon={"trash"}
                            iconColor={"#f7f7f7"}
                            tightPad={true}
                            buttonStyle={"opacityIncrease"}
                            isDisabled={isConverting}
                        />
                    {/if}
                </div>
            {/each}
        </div>

        <div style="margin-top: 15px;">
            <BoxButton
                buttonText={isConverting ? null : "Convert Files"}
                on:click={convertFiles}
                fullWidth={true}
                isDisabled={isConverting}
                buttonIcon={isConverting ? "loading" : null}
            />
        </div>

        {#if error}
            <div bind:this={errorElement}>
                <FormError
                    errorMessage={error}
                    errorTitle={"Conversion Error"}
                />
            </div>
        {/if}
    {:else if isConverting}
        <Loader />

        <p>Hang tight... converting.</p>
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
            <div bind:this={errorElement}>
                <FormError
                    errorMessage={error}
                    errorTitle={"Conversion Error"}
                />
            </div>
        {/if}
    {/if}
</div>
