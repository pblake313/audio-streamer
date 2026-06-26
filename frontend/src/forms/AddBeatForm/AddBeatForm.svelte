<script lang="ts">
    import "./AddBeatForm.css";
    import { tick, onDestroy } from "svelte";
    import { pushNotification } from "../../stores/NotificationStore";
    import BoxButton from "../../components/buttons/BoxButton.svelte";
    import { buildAddBeatFormData, validateAddBeatForm } from "./AddBeatHelpers";
    import BpmInput from "../../components/form-inputs/BpmInput.svelte";
    import AddTrackPreview from "../../components/previews/AddTrackPreview.svelte";
    import {
        beatMoodOptions,
        colorOptions,
        songKeyOptions,
        songModeOptions,
        tagOptions,
        trackTypeOptions,
    } from "../../lib/selectoptions";
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import { upsertBeat } from "../../stores/AudioPlayer/beatArrayStore";
    import TextInput from "../../components/form-inputs/text/TextInput.svelte";
    import SelectButton from "../../components/form-inputs/select/SelectButton.svelte";
    import ImageUploader from "../../components/form-inputs/file-uploaders/ImageUploader.svelte";
    import Mp3Uploader from "../../components/form-inputs/file-uploaders/Mp3Uploader.svelte";
    import ColorSelect from "../../components/form-inputs/select/ColorSelect.svelte";
    import FormError from "../../components/errors/FormError.svelte";

    type TrackType = "Beat" | "Reference";

    let formSubmitted = false;
    let isLoading = false;

    let form: {
        title: string | null;
        tagOne: string | null;
        tagTwo: string | null;
        mood: string | null;
        customTag: string | null;
        customTagColor: string | null;
        key: string;
        mode: string;
        bpm: number;
        artworkFile: File | null;
        mp3File: File | null;
        trackType: TrackType;
    } = {
        title: null,
        tagOne: null,
        tagTwo: null,
        mood: null,
        customTag: null,
        customTagColor: null,
        key: "C",
        mode: "Minor",
        bpm: 0,
        artworkFile: null,
        mp3File: null,
        trackType: "Beat",
    };

    let formError: string | null = null;
    let formErrorEl: HTMLDivElement | null = null;
    let formErrorTimeout: ReturnType<typeof setTimeout> | null = null;

    let temporaryArtUrl: string | null = null;
    let temporaryMp3Url: string | null = null;

    function setTrackType(value: string) {
        if (value === "Beat" || value === "Reference") {
            form.trackType = value;
        }
    }

    function clearFormErrorTimeout() {
        if (formErrorTimeout) {
            clearTimeout(formErrorTimeout);
            formErrorTimeout = null;
        }
    }

    async function showFormError(message: string) {
        clearFormErrorTimeout();

        formError = message;

        await tick();

        formErrorEl?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        formErrorTimeout = setTimeout(() => {
            formError = null;
            formErrorTimeout = null;
        }, 5000);
    }

    async function addBeat() {
        clearFormErrorTimeout();
        formError = null;

        if (isLoading) return;

        try {
            formSubmitted = true;
            isLoading = true;

            const formData = buildAddBeatFormData(form);

            const response = await authorizedFetch("/secure/beats/add-beat", {
                method: "POST",
                body: formData,
            });

            if (response.newBeat) {
                upsertBeat(response.newBeat);

                pushNotification(
                    "Beat added successfully!",
                    "Success",
                    false,
                    1500,
                    "New Beat Created",
                );
            }
        } catch (error: any) {
            const errorMessage =
                error?.message || "An unknown error has occurred.";

            await showFormError(errorMessage);
        } finally {
            isLoading = false;
        }
    }

    onDestroy(() => {
        clearFormErrorTimeout();
    });
</script>

<div class="abf_preview">
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

<div class="abf_formContainer">
    <div class="abf_form">
        <div class="abf_details">
            <h5>Details</h5>

            <div class="abf_trackDetails">
                <TextInput
                    value={form.title}
                    label={"Beat Title"}
                    inputError={formSubmitted && !form.title
                        ? "Enter a valid beat title."
                        : null}
                    onTextChange={(v) => (form.title = v)}
                    maxlength={50}
                />

                <div class="abf_multiInputFlex">
                    <div class="abf_bpm">
                        <BpmInput
                            bpmChanged={(v) => (form.bpm = v)}
                            inputError={formSubmitted && !form.bpm
                                ? "Number between 1 and 199."
                                : null}
                            bpm={form.bpm}
                        />
                    </div>

                    <div class="abf_key">
                        <SelectButton
                            onSelect={(v) => (form.key = v)}
                            label={"Key"}
                            id={"songKey"}
                            selectedOption={form.key}
                            options={songKeyOptions}
                        />
                    </div>

                    <div class="abf_mode">
                        <SelectButton
                            label={"Mode"}
                            id={"songMode"}
                            selectedOption={form.mode}
                            options={songModeOptions}
                            onSelect={(v) => (form.mode = v)}
                        />
                    </div>
                </div>

                <div class="abf_multiInputFlex">
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
                            label={"Custom Tag Color"}
                            selectedOption={form.customTagColor}
                            {colorOptions}
                        />
                    </div>
                </div>

                <div class="abf_multiInputFlex">
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

                <div class="abf_multiInputFlex">
                    <div class="tagHalf">
                        <SelectButton
                            options={beatMoodOptions}
                            label="Mood"
                            onSelect={(v) => (form.mood = v)}
                            selectedOption={form.mood}
                        />
                    </div>

                    <div class="tagHalf">
                        <SelectButton
                            options={trackTypeOptions}
                            label={"Track Type"}
                            onSelect={setTrackType}
                            selectedOption={form.trackType}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="abf_files">
            <h5>Files</h5>

            <div class="abf_wrapFiles">
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

                <div class="abf_submit">
                    <BoxButton
                        on:click={addBeat}
                        buttonText={isLoading ? "Adding Beat" : "Add Beat"}
                        fullWidth={true}
                        isDisabled={isLoading}
                        buttonIcon={isLoading ? "loading" : null}
                    />

                    {#if formError}
                        <div class="abf_error" bind:this={formErrorEl}>
                            <FormError
                                errorMessage={formError}
                                errorTitle={"Add Beat Error"}
                                textAlign={"center"}
                                color={"gold"}
                            />
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>