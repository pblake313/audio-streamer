<script lang="ts">
    import "./AddBeatForm.css";
    import { onDestroy } from "svelte";
    import BoxButton from "../../components/buttons/BoxButton.svelte";
    import { buildAddBeatFormData } from "./AddBeatHelpers";
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
    import { showAudioPlayer, upsertBeat } from "../../stores/AudioPlayer/BeatsStore";
    import TextInput from "../../components/form-inputs/text/TextInput.svelte";
    import SelectButton from "../../components/form-inputs/select/SelectButton.svelte";
    import ImageUploader from "../../components/form-inputs/file-uploaders/ImageUploader.svelte";
    import Mp3Uploader from "../../components/form-inputs/file-uploaders/Mp3Uploader.svelte";
    import ColorSelect from "../../components/form-inputs/select/ColorSelect.svelte";
    import AlertIcon from "../../components/Icons/svg/AlertIcon.svelte";
    import { goto } from "$app/navigation";

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
        key: string | null;
        mode: string | null;
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

    // required fields still empty, shown next to the sticky submit button
    // references don't need a key, mode, or BPM
    $: isReference = form.trackType === "Reference";

    $: missingCount = [
        !form.title?.trim(),
        !isReference && !(form.bpm >= 1 && form.bpm <= 199),
        !isReference && !form.key,
        !isReference && !form.mode,
        !form.artworkFile,
        !form.mp3File,
    ].filter(Boolean).length;

    function setTrackType(value: string | null) {
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

            // validates form and builds data to send.
            const formData = buildAddBeatFormData(form);

            const response = await authorizedFetch("/secure/beats/add-beat", {
                method: "POST",
                body: formData,
            });

            upsertBeat(response.createdBeat);

            goto('/portal')

        } catch (error: any) {
            console.log(error)

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

<div class="abf_page">
<div class="abf_preview">
    <AddTrackPreview
        compact={true}
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
        <div class="abf_main">
            <!-- details -->
            <section class="abf_card">
                <header class="abf_cardHeader">
                    <span class="abf_step">01</span>
                    <div>
                        <h5 class="abf_cardTitle">Track details</h5>
                        <p class="abf_cardHint">The basics shown on every track.</p>
                    </div>
                </header>

                <div class="abf_fields">
                    <div>
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

                    <div class="abf_grid abf_grid_details">
                        <div>
                            <SelectButton
                                options={trackTypeOptions}
                                label={"Track Type"}
                                onSelect={setTrackType}
                                selectedOption={form.trackType}
                            />
                        </div>

                        <div>
                            <BpmInput
                                label={isReference ? "BPM (optional)" : "BPM"}
                                bpmChanged={(v) => (form.bpm = v)}
                                inputError={formSubmitted && !isReference && !form.bpm
                                    ? "Number between 1 and 199."
                                    : null}
                                bpm={form.bpm}
                            />
                        </div>

                        <div>
                            <SelectButton
                                onSelect={(v) => (form.key = v)}
                                label={isReference ? "Key (optional)" : "Key"}
                                id={"songKey"}
                                selectedOption={form.key}
                                options={songKeyOptions}
                                clearable={true}
                                inputError={formSubmitted && !isReference && !form.key
                                    ? "Select a key."
                                    : null}
                            />
                        </div>

                        <div>
                            <SelectButton
                                label={isReference ? "Mode (optional)" : "Mode"}
                                id={"songMode"}
                                selectedOption={form.mode}
                                options={songModeOptions}
                                onSelect={(v) => (form.mode = v)}
                                clearable={true}
                                inputError={formSubmitted && !isReference && !form.mode
                                    ? "Select a mode."
                                    : null}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <!-- tags -->
            <section class="abf_card">
                <header class="abf_cardHeader">
                    <span class="abf_step">02</span>
                    <div>
                        <h5 class="abf_cardTitle">Tags</h5>
                        <p class="abf_cardHint">Used for filtering the track list. All optional.</p>
                    </div>
                </header>

                <div class="abf_fields">
                    <div class="abf_grid abf_grid_custom">
                        <div>
                            <TextInput
                                label={"Custom Tag"}
                                onTextChange={(v) => (form.customTag = v)}
                                value={form.customTag}
                                maxlength={35}
                            />
                        </div>

                        <div>
                            <ColorSelect
                                onSelect={(v) => (form.customTagColor = v)}
                                label={"Custom Tag Color"}
                                selectedOption={form.customTagColor}
                                {colorOptions}
                            />
                        </div>
                    </div>

                    <div class="abf_grid abf_grid_three">
                        <div>
                            <SelectButton
                                onSelect={(v) => (form.tagOne = v)}
                                options={tagOptions}
                                id={"tagNoOne"}
                                label={"Tag One"}
                                selectedOption={form.tagOne}
                            />
                        </div>

                        <div>
                            <SelectButton
                                onSelect={(v) => (form.tagTwo = v)}
                                options={tagOptions}
                                id={"tagNoTwo"}
                                label={"Tag Two"}
                                selectedOption={form.tagTwo}
                            />
                        </div>

                        <div>
                            <SelectButton
                                options={beatMoodOptions}
                                label="Mood"
                                onSelect={(v) => (form.mood = v)}
                                selectedOption={form.mood}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- files + submit -->
        <aside class="abf_side">
            <section class="abf_card">
                <header class="abf_cardHeader">
                    <span class="abf_step">03</span>
                    <div>
                        <h5 class="abf_cardTitle">Files</h5>
                        <p class="abf_cardHint">Artwork image and an MP3 for streaming.</p>
                    </div>
                </header>

                <div class="abf_fields abf_filesRow">
                    <!-- each uploader renders several top-level elements; keep them together -->
                    <div class="abf_uploader">
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

                    <div class="abf_uploader">
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

            </section>
        </aside>
    </div>
</div>

<!-- submit bar stays pinned to the bottom of the screen -->
<div class="abf_submitBar" class:abf_submitBar_raised={$showAudioPlayer}>
    <div class="abf_submitInner">
        {#if formError}
            <div class="abf_error" role="alert" bind:this={formErrorEl}>
                <span class="abf_errorIcon">
                    <AlertIcon color={"#ff6b6b"} height={"18px"} />
                </span>
                <div class="abf_errorText">
                    <p class="abf_errorTitle">Couldn't add this beat</p>
                    <p class="abf_errorMessage">{formError}</p>
                </div>
            </div>
        {/if}

        <div class="abf_submitRow">
            <p class="abf_status" class:abf_status_ready={missingCount === 0}>
                {#if missingCount === 0}
                    Ready to add
                {:else}
                    {missingCount} required {missingCount === 1 ? "field" : "fields"} left
                {/if}
            </p>

            <div class="abf_submitButton">
                <BoxButton
                    on:click={addBeat}
                    buttonText={isLoading ? "Adding Beat" : "Add Beat"}
                    fullWidth={true}
                    isDisabled={isLoading}
                    buttonIcon={isLoading ? "loading" : null}
                />
            </div>
        </div>
    </div>
</div>
</div>
