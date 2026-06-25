<script lang="ts">
    import "./AddBeatForm.css";
    import { pushNotification } from "../../stores/NotificationStore";
    import { onMount } from "svelte";
    import { getSocket } from "../../stores/socketStore";
    import BoxButton from "../../components/buttons/BoxButton.svelte";
    import { buildFormData, validateAddBeatForm } from "./AddBeatHelpers";
    import BpmInput from "../../components/form-inputs/BpmInput.svelte";
    import AddTrackPreview from "../../components/previews/AddTrackPreview.svelte";
    import {
        beatMoodOptions,
        colorOptions,
        songKeyOptions,
        songModeOptions,
        tagOptions,
    } from "../../lib/selectoptions";
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import { upsertBeat } from "../../stores/AudioPlayer/beatArrayStore";
    import { goto } from "$app/navigation";
    import { audioPlayerState } from "../../stores/AudioPlayerStore";
    import AudioLoader from "../../components/loaders/AudioLoader.svelte";
    import TextInput from "../../components/form-inputs/text/TextInput.svelte";
    import SelectButton from "../../components/form-inputs/select/SelectButton.svelte";
    import ImageUploader from "../../components/form-inputs/file-uploaders/ImageUploader.svelte";
    import Mp3Uploader from "../../components/form-inputs/file-uploaders/Mp3Uploader.svelte";
    import ColorSelect from "../../components/form-inputs/select/ColorSelect.svelte";
    import BackendStatusBlock from "../../components/misc/BackendStatusBlock.svelte";

    let socket: any;

    let shaking: boolean = false;
    let formSubmitted = false;
    let isLoading = false;

    // form values

    let form: {
        title: string | null,
        tagOne: string | null,
        tagTwo: string | null,
        mood: string | null,
        customTag: string | null,
        customTagColor: string | null,
        key: string,
        mode: string,
        bpm: number,
        artworkFile: File | null,
        mp3File: File | null
    } = {
        title: null,
        tagOne: null,
        tagTwo: null,
        mood: null,
        customTag: null,
        customTagColor: null,
        key: 'C',
        mode: 'Minor',
        bpm: 0,
        artworkFile: null,
        mp3File: null
    }

    // temporary things for preview
    let temporaryArtUrl: string | null = null;
    let temporaryMp3Url: string | null = null;

    let beatUploadStatus: string | null = null;
    let artUploadStatus: "Waiting" | "Uploading" | "Upload Success" = "Waiting";
    let mp3UploadStatus: "Waiting" | "Uploading" | "Upload Success" = "Waiting";

    onMount(async () => {
        socket = await getSocket(); // Get the singleton socket instance

        if (socket && typeof socket.on === "function") {
            socket.on("uploadStatus", (status: string) => {
                beatUploadStatus = status;
            });
            socket.on("uploadStarted", (status: string) => {
                if (status === "artwork") {
                    artUploadStatus = "Uploading";
                }
                if (status === "mp3") {
                    mp3UploadStatus = "Uploading";
                }
            });
            socket.on("uploadComplete", (status: string) => {
                if (status === "artwork") {
                    artUploadStatus = "Upload Success";
                }
                if (status === "mp3") {
                    mp3UploadStatus = "Upload Success";
                }
            });
        }
    });

    function resetUploadStatuses() {
        artUploadStatus = "Waiting";
        mp3UploadStatus = "Waiting";
    }

    async function addBeat() {
        formSubmitted = true;

        const addBeatFormIsValid = validateAddBeatForm();

        if (!addBeatFormIsValid) return;
        
        isLoading = true;

        try {
            beatUploadStatus = "Sending data...";

            const socketId = socket.id;

            const response = await authorizedFetch("/secure/beats/add-beat", {
                method: "POST",
                headers: {
                    "x-socket-id": socketId,
                },
                // body: formData,
            });

            // console.log(response)

            if (response.newBeat) {
                upsertBeat(response.newBeat);
                pushNotification(
                    "Beat added successfully!",
                    "Success",
                    false,
                    1500,
                    "New Beat Created",
                );
                goto("/portal/manage-beats");
            } else {
                pushNotification(
                    "There was a successful response, but no new beat was returned.",
                    "Error",
                    false,
                    5000,
                    "Add Beat Error",
                );
            }
        } catch (error: any) {
            console.log(error)

            if (error.message)
                pushNotification(
                    error.message || "An unknown error has occurred.",
                    "Error",
                    false,
                    5000,
                    "Add Beat Error",
                );
            // console.log(error)
        } finally {
            isLoading = false;
            beatUploadStatus = null;
            resetUploadStatuses();
        }
    }

    function shake() {
        shaking = true;
        setTimeout(() => {
            shaking = false;
        }, 600); // reset shaking
    }
</script>

<div class="splitForPreview">
    <div class="trackPreviewSide">
        <AddTrackPreview
            albumUrl={temporaryArtUrl}
            bpm={form.bpm}
            key={form.key}
            mode={form.mode}
            tagOne={form.tagOne}
            tagTwo={form.tagTwo}
            title={form.title}
            mood={form.mood}
            customTag={form.customTag}
            customTagColor={form.customTagColor}
        />
    </div>

    <div class="beatFormSide">
        {#if isLoading}
            <AudioLoader backgroundColor={"#323232"}></AudioLoader>

            {#if artUploadStatus}
                <BackendStatusBlock
                    title={"Artwork Status"}
                    status={artUploadStatus}
                ></BackendStatusBlock>
            {/if}
            {#if mp3UploadStatus}
                <BackendStatusBlock
                    title={"MP3 Status"}
                    status={mp3UploadStatus}
                ></BackendStatusBlock>
            {/if}

            {#if beatUploadStatus}
                <p style="font-size: 9pt; text-align: center;">
                    {beatUploadStatus}
                </p>
            {/if}
        {:else}
            <div
                class="addBeatForm"
                class:padFormForPlayer={$audioPlayerState !== "Idle"}
            >
                <div class="addBeatHalf">
                    <div class="whh">
                        <p><b>Track Details</b></p>
                    </div>
                    <div class="wrapFIn">
                        <TextInput
                            value={form.title}
                            label={"Beat Title"}
                            inputError={formSubmitted && !form.title
                                ? "Enter a valid beat title."
                                : null}
                            onTextChange={(v) => (form.title = v)}
                            maxlength={50}
                        />
                    </div>

                    <div class="tagsFlex">
                        <div class="addBpmSel">
                            <BpmInput
                                bpmChanged={(v) => (form.bpm = v)}
                                inputError={formSubmitted && !form.bpm
                                    ? "Number between 1 and 199."
                                    : null}
                                bpm={form.bpm}
                            />
                        </div>

                        <div class="keySelect">
                            <SelectButton
                                onSelect={(v) => (form.key = v)}
                                label={"Key"}
                                id={"songKey"}
                                selectedOption={form.key}
                                options={songKeyOptions}
                            />
                        </div>

                        <div class="modeSelect">
                            <SelectButton
                                label={"Mode"}
                                id={"songMode"}
                                selectedOption={form.mode}
                                options={songModeOptions}
                                onSelect={(v) => (form.mode = v)}
                            />
                        </div>
                    </div>

                    <div class="whh">
                        <p><b>Files</b></p>
                    </div>
                    <div class="wrapFIn">
                        <ImageUploader
                            fileUploaded={(v) => {
                                form.artworkFile = v.file;
                                temporaryArtUrl = v.imageUrl;
                            }}
                            clearInput={() => {
                                form.artworkFile = null;
                                temporaryArtUrl = null;
                            }}
                            inputError={formSubmitted && !form.artworkFile
                                ? "Please upload an artwork image."
                                : null}
                            label={"Artwork"}
                            fileName={form.artworkFile?.name}
                        />
                    </div>

                    <div class="wrapFIn">
                        <Mp3Uploader
                            label={"File Preview (MP3)"}
                            mp3Url={temporaryMp3Url}
                            fileName={form.mp3File?.name}
                            inputError={formSubmitted && !form.mp3File
                                ? "Upload track audio file."
                                : ""}
                            mp3Uploaded={(v) => {
                                form.mp3File = v.file;
                                temporaryMp3Url = v.mp3Url;
                            }}
                            clearInput={() => {
                                form.mp3File = null;
                                temporaryMp3Url = null;
                            }}
                        />
                    </div>
                </div>

                <!-- tags -->
                <div class="addBeatHalf">
                    <div class="whh">
                        <p><b>Tags</b></p>
                    </div>

                    <div class="tagsFlex">
                        <div class="cTag">
                            <TextInput
                                label={"Custom Tag"}
                                onTextChange={(v) => (form.customTag = v)}
                                value={form.customTag}
                                maxlength={35}
                            />
                        </div>
                        <div class="customColor">
                            <ColorSelect
                                onSelect={(v) => (form.customTagColor = v)}
                                label={"Tag Color"}
                                selectedOption={form.customTagColor}
                                {colorOptions}
                            />
                        </div>
                    </div>

                    <div class="tagsFlex">
                        <div class="tagHalf">
                            <SelectButton
                                onSelect={(v) => (form.tagOne = v)}
                                options={tagOptions}
                                id={"tagNoOne"}
                                label={"Tag One"}
                                selectedOption={form.tagOne}
                            />
                        </div>

                        <div class="tagHalf">
                            <SelectButton
                                onSelect={(v) => (form.tagTwo = v)}
                                options={tagOptions}
                                id={"tagNoTwo"}
                                label={"Tag Two"}
                                selectedOption={form.tagTwo}
                            />
                        </div>
                    </div>

                    <SelectButton
                        options={beatMoodOptions}
                        label="Mood"
                        onSelect={(v) => (form.mood = v)}
                        selectedOption={form.mood}
                    />
                </div>
            </div>

            {#if $audioPlayerState !== "Idle"}
                <div class="mobilePadder"></div>
            {/if}

            <div
                class="wrapAddBeatSub"
                class:padforPlayer={$audioPlayerState !== "Idle"}
            >
                <div class="innerSubmitButton">
                    <BoxButton
                        buttonIcon={"add"}
                        {shaking}
                        on:click={addBeat}
                        buttonText={"Add Beat"}
                        fullWidth={true}
                    ></BoxButton>
                </div>
            </div>
        {/if}
    </div>
</div>
