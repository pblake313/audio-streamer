<script lang="ts">
    // shares its layout and styles with the add track form
    import "./AddBeatForm.css";

    import BoxButton from "../../components/buttons/BoxButton.svelte";
    import type { Beat } from "../../lib/types/Beats";
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import AddTrackPreview from "../previews/AddTrackPreview.svelte";
    import TextInput from "../form-inputs/text/TextInput.svelte";
    import SelectButton from "../form-inputs/select/SelectButton.svelte";
    import {
        beatMoodOptions,
        colorOptions,
        songKeyOptions,
        songModeOptions,
        tagOptions,
        trackTypeOptions,
    } from "../../lib/selectoptions";
    import ColorSelect from "../form-inputs/select/ColorSelect.svelte";
    import BpmInput from "../form-inputs/BpmInput.svelte";
    import ImageUploader from "../form-inputs/file-uploaders/ImageUploader.svelte";
    import Mp3Uploader from "../form-inputs/file-uploaders/Mp3Uploader.svelte";
    import AlertIcon from "../Icons/svg/AlertIcon.svelte";
    import DeleteTrackForm from "./DeleteTrackForm.svelte";
    import {
        createValidEditBeatFormObject,
        editBeatFormError,
        setEditBeatFormError,
    } from "../../stores/EditBeatStore";
    import { showAudioPlayer, upsertBeat } from "../../stores/AudioPlayer/BeatsStore";
    import { goto } from "$app/navigation";
    import { pushNotification } from "../../stores/NotificationStore";

    export let beat: Beat;

    let isUpdatingBeat: boolean = false;
    let formSubmitted: boolean = false;
    let confirmingDelete: boolean = false;

    // files
    let newArtworkFile: File | null = null;
    let newMp3File: File | null = null;

    // initial file values
    let artworkUrl: string | null = beat.artworkUrl;
    let mp3Url: string | null = beat.mp3Url;

    let form: {
        title: string | null;
        tagOne: string | null;
        tagTwo: string | null;
        customTagColor: string | null;
        customTag: string | null;
        mood: string | null;
        key: string | null;
        mode: string | null;
        trackType: string;
        bpm: number;
    } = {
        title: beat.beatTitle,
        tagOne: beat.tagOne,
        tagTwo: beat.tagTwo,
        customTagColor: beat.customTagColor,
        customTag: beat.customTag,
        mood: beat.mood,
        key: beat.key,
        mode: beat.mode,
        trackType: beat.trackType,
        bpm: beat.bpm ?? 0,
    };

    // references don't need a key, mode, or BPM
    $: isReference = form.trackType === "Reference";

    $: missingCount = [
        !form.title?.trim(),
        !isReference && !(form.bpm >= 1 && form.bpm <= 199),
        !isReference && !form.key,
        !isReference && !form.mode,
        !artworkUrl && !newArtworkFile,
        !mp3Url && !newMp3File,
    ].filter(Boolean).length;

    // anything different from the saved track?
    $: hasChanges =
        !!newArtworkFile ||
        !!newMp3File ||
        (form.title ?? "") !== (beat.beatTitle ?? "") ||
        (form.tagOne ?? null) !== (beat.tagOne ?? null) ||
        (form.tagTwo ?? null) !== (beat.tagTwo ?? null) ||
        (form.customTag ?? null) !== (beat.customTag ?? null) ||
        (form.customTagColor ?? null) !== (beat.customTagColor ?? null) ||
        (form.mood ?? null) !== (beat.mood ?? null) ||
        (form.key ?? null) !== (beat.key ?? null) ||
        (form.mode ?? null) !== (beat.mode ?? null) ||
        form.trackType !== beat.trackType ||
        form.bpm !== (beat.bpm ?? 0);

    async function updateBeat() {
        try {
            formSubmitted = true;

            if (isUpdatingBeat) return;

            // validate beat obj.
            const validObj: FormData = createValidEditBeatFormObject(form);

            if (!artworkUrl && !newArtworkFile) {
                throw new Error("Please select an artwork file.");
            }
            if (newArtworkFile) {
                validObj.append("newArtwork", newArtworkFile);
            }

            if (!mp3Url && !newMp3File) {
                throw new Error("Please select an audio file.");
            }

            if (newMp3File) {
                validObj.append("newMp3File", newMp3File);
            }

            editBeatFormError.set(null);
            isUpdatingBeat = true;

            const response = await authorizedFetch(
                `/secure/beats/update-beat/${beat.id}`,
                {
                    method: "POST",
                    body: validObj,
                },
            );

            upsertBeat(response.updatedBeat);
            pushNotification(
                "Beat updated successfully.",
                "Success",
                false,
                1700,
                "Updated!",
            );
            goto("/portal");
        } catch (err: any) {
            console.log(err);

            const errorMessage =
                err.message || "An unknown error has occurred.";
            setEditBeatFormError(errorMessage);
        } finally {
            isUpdatingBeat = false;
        }
    }
</script>

<div class="abf_page">
    <div class="abf_preview">
        <AddTrackPreview
            compact={true}
            title={form.title}
            bpm={form.bpm}
            tagOne={form.tagOne}
            tagTwo={form.tagTwo}
            albumUrl={artworkUrl}
            key={form.key}
            mode={form.mode}
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
                                label={"Track Title"}
                                onTextChange={(v) => {
                                    form.title = v;
                                }}
                                value={form.title}
                                maxlength={50}
                                inputError={formSubmitted && !form.title
                                    ? "Enter a valid track title."
                                    : null}
                            />
                        </div>

                        <div class="abf_grid abf_grid_details">
                            <div>
                                <SelectButton
                                    onSelect={(v) => {
                                        if (v) form.trackType = v;
                                    }}
                                    label={"Track Type"}
                                    selectedOption={form.trackType}
                                    options={trackTypeOptions}
                                />
                            </div>

                            <div>
                                <BpmInput
                                    bpmChanged={(v) => {
                                        form.bpm = v;
                                    }}
                                    bpm={form.bpm}
                                    label={isReference ? "BPM (optional)" : "BPM"}
                                    inputError={formSubmitted && !isReference && form.bpm <= 0
                                        ? "Number between 1 and 199."
                                        : null}
                                />
                            </div>

                            <div>
                                <SelectButton
                                    label={isReference ? "Key (optional)" : "Key"}
                                    onSelect={(v) => {
                                        form.key = v;
                                    }}
                                    options={songKeyOptions}
                                    selectedOption={form.key}
                                    clearable={true}
                                    inputError={formSubmitted && !isReference && !form.key
                                        ? "Select a key."
                                        : null}
                                />
                            </div>

                            <div>
                                <SelectButton
                                    onSelect={(v) => {
                                        form.mode = v;
                                    }}
                                    selectedOption={form.mode}
                                    label={isReference ? "Mode (optional)" : "Mode"}
                                    options={songModeOptions}
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
                                    onTextChange={(v) => {
                                        form.customTag = v;
                                    }}
                                    value={form.customTag}
                                    maxlength={35}
                                />
                            </div>

                            <div>
                                <ColorSelect
                                    label={"Custom Tag Color"}
                                    onSelect={(v) => {
                                        form.customTagColor = v;
                                    }}
                                    selectedOption={form.customTagColor}
                                    {colorOptions}
                                />
                            </div>
                        </div>

                        <div class="abf_grid abf_grid_three">
                            <div>
                                <SelectButton
                                    label={"Tag One"}
                                    selectedOption={form.tagOne}
                                    options={tagOptions}
                                    onSelect={(v) => {
                                        form.tagOne = v;
                                    }}
                                />
                            </div>

                            <div>
                                <SelectButton
                                    label={"Tag Two"}
                                    selectedOption={form.tagTwo}
                                    options={tagOptions}
                                    onSelect={(v) => {
                                        form.tagTwo = v;
                                    }}
                                />
                            </div>

                            <div>
                                <SelectButton
                                    label={"Mood"}
                                    selectedOption={form.mood}
                                    onSelect={(v) => {
                                        form.mood = v;
                                    }}
                                    options={beatMoodOptions}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <!-- files -->
            <section class="abf_card">
                <header class="abf_cardHeader">
                    <span class="abf_step">03</span>
                    <div>
                        <h5 class="abf_cardTitle">Files</h5>
                        <p class="abf_cardHint">Replace the artwork or the MP3, or keep the current ones.</p>
                    </div>
                </header>

                <div class="abf_fields abf_filesRow">
                    <div class="abf_uploader">
                        <ImageUploader
                            label="Artwork"
                            imageUrl={artworkUrl}
                            fileName={newArtworkFile?.name ?? (artworkUrl ? "Current artwork" : null)}
                            fileUploaded={({ imageUrl: newUrl, file }) => {
                                artworkUrl = newUrl;
                                newArtworkFile = file;
                            }}
                            clearInput={() => {
                                artworkUrl = null;
                                newArtworkFile = null;
                            }}
                            inputError={!artworkUrl && !newArtworkFile && formSubmitted
                                ? "Please upload an artwork image."
                                : null}
                        />
                    </div>

                    <div class="abf_uploader">
                        <Mp3Uploader
                            label="File Preview (MP3)"
                            {mp3Url}
                            fileName={newMp3File?.name ?? (mp3Url ? "Current audio" : null)}
                            mp3Uploaded={({ mp3Url: newUrl, file }) => {
                                mp3Url = newUrl;
                                newMp3File = file;
                            }}
                            clearInput={() => {
                                mp3Url = null;
                                newMp3File = null;
                            }}
                            inputError={!mp3Url && !newMp3File && formSubmitted
                                ? "Upload track audio file."
                                : null}
                        />
                    </div>
                </div>
            </section>

            <!-- delete -->
            <section class="abf_card">
                <header class="abf_cardHeader">
                    <span class="abf_step">04</span>
                    <div>
                        <h5 class="abf_cardTitle">Delete track</h5>
                        <p class="abf_cardHint">Permanently removes this track and its files.</p>
                    </div>
                </header>

                {#if confirmingDelete}
                    <div class="abf_deleteConfirm">
                        <p class="abf_deleteQuestion">
                            Delete <strong>{beat.beatTitle}</strong>? This can't be undone.
                        </p>

                        <div class="abf_deleteActions">
                            <DeleteTrackForm {beat} />

                            <BoxButton
                                buttonText={"Cancel"}
                                buttonStyle={"glass"}
                                tightPad={true}
                                on:click={() => (confirmingDelete = false)}
                            />
                        </div>
                    </div>
                {:else}
                    <BoxButton
                        buttonText={"Delete track…"}
                        buttonStyle={"glass"}
                        tightPad={true}
                        on:click={() => (confirmingDelete = true)}
                    />
                {/if}
            </section>
        </div>
    </div>

    <!-- save bar stays pinned to the bottom of the screen -->
    <div class="abf_submitBar" class:abf_submitBar_raised={$showAudioPlayer}>
        <div class="abf_submitInner">
            {#if $editBeatFormError}
                <div class="abf_error" role="alert">
                    <span class="abf_errorIcon">
                        <AlertIcon color={"#ff6b6b"} height={"18px"} />
                    </span>
                    <div class="abf_errorText">
                        <p class="abf_errorTitle">Couldn't save this track</p>
                        <p class="abf_errorMessage">{$editBeatFormError}</p>
                    </div>
                </div>
            {/if}

            <div class="abf_submitRow">
                <p
                    class="abf_status"
                    class:abf_status_ready={missingCount === 0 && hasChanges}
                >
                    {#if missingCount > 0}
                        {missingCount} required {missingCount === 1 ? "field" : "fields"} left
                    {:else if hasChanges}
                        Unsaved changes
                    {:else}
                        No changes yet
                    {/if}
                </p>

                <div class="abf_submitButton">
                    <BoxButton
                        buttonText={isUpdatingBeat ? "Saving" : "Save Changes"}
                        fullWidth={true}
                        on:click={updateBeat}
                        isDisabled={isUpdatingBeat}
                        buttonIcon={isUpdatingBeat ? "loading" : null}
                    />
                </div>
            </div>
        </div>
    </div>
</div>
