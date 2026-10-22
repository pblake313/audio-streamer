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
    import DownloadArrowIcon from "../Icons/svg/DownloadArrowIcon.svelte";
    import { downloadBeatFile, type BeatFileKind } from "../../helpers/downloadBeatFile";

    export let beat: Beat;

    // ---------------------------------------------
    // downloads of the files saved on this track
    // (not anything picked in the form but not saved yet)
    // ---------------------------------------------
    $: downloads = [
        { kind: "artwork", label: "Artwork", saved: !!beat.artworkUrl },
        { kind: "wav", label: "WAV", saved: !!beat.wavUrl },
        { kind: "mp3", label: "MP3", saved: !!beat.mp3Url },
        { kind: "stems", label: "Stems", saved: !!beat.stemsUrl },
    ] as { kind: BeatFileKind; label: string; saved: boolean }[];

    // the track always has artwork and audio, so there's always something to zip
    $: anythingSaved = downloads.some((file) => file.saved);

    let downloading: BeatFileKind | null = null;

    async function download(kind: BeatFileKind, label: string) {
        if (downloading) return;

        downloading = kind;

        try {
            await downloadBeatFile(beat, kind);
        } catch (err: any) {
            pushNotification(
                err?.message || "An unknown error has occurred.",
                "Error",
                false,
                4000,
                `Couldn't download ${label}`,
            );
        } finally {
            downloading = null;
        }
    }

    let isUpdatingBeat: boolean = false;
    let formSubmitted: boolean = false;
    let confirmingDelete: boolean = false;

    // files
    let newArtworkFile: File | null = null;
    let newMp3File: File | null = null;
    let newWavFile: File | null = null;
    let newStemsFile: File | null = null;

    // initial file values
    let artworkUrl: string | null = beat.artworkUrl;
    let mp3Url: string | null = beat.mp3Url;
    let wavUrl: string | null = beat.wavUrl ?? null;
    // set while a stems zip (saved or newly picked) is in the form
    let stemsUrl: string | null = beat.stemsUrl ?? null;

    // a saved file was cleared and not replaced: tell the backend to drop it
    $: removeMp3 = !!beat.mp3Url && !mp3Url && !newMp3File;
    $: removeWav = !!beat.wavUrl && !wavUrl && !newWavFile;
    $: removeStems = !!beat.stemsUrl && !stemsUrl && !newStemsFile;

    // a track keeps a WAV, an MP3, or both
    $: missingAudio = !mp3Url && !newMp3File && !wavUrl && !newWavFile;

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
        missingAudio,
    ].filter(Boolean).length;

    // anything different from the saved track?
    $: hasChanges =
        !!newArtworkFile ||
        !!newMp3File ||
        !!newWavFile ||
        !!newStemsFile ||
        removeMp3 ||
        removeWav ||
        removeStems ||
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

            if (missingAudio) {
                throw new Error("Upload a WAV file, an MP3 file, or both.");
            }

            if (newMp3File) {
                validObj.append("newMp3File", newMp3File);
            }

            if (newWavFile) {
                validObj.append("newWavFile", newWavFile);
            }

            if (removeMp3) {
                validObj.append("removeMp3", "true");
            }

            if (removeWav) {
                validObj.append("removeWav", "true");
            }

            if (newStemsFile) {
                validObj.append("newStemsFile", newStemsFile);
            }

            if (removeStems) {
                validObj.append("removeStems", "true");
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
            <!-- files -->
            <section class="abf_card">
                <header class="abf_cardHeader">
                    <span class="abf_step">01</span>
                    <div>
                        <h5 class="abf_cardTitle">Files</h5>
                        <p class="abf_cardHint">Replace or remove the artwork, audio, and stems. Keep a WAV, an MP3, or both.</p>
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
                            format="zip"
                            label="Stems (ZIP, optional)"
                            dropzoneLabel="Add stems"
                            maxFileSizeMB={200}
                            mp3Url={stemsUrl}
                            fileName={newStemsFile?.name ??
                                (stemsUrl ? beat.stemsFileName || "Current stems" : null)}
                            fileSize={newStemsFile ? null : beat.stemsBytes ?? null}
                            mp3Uploaded={({ mp3Url: newUrl, file }) => {
                                stemsUrl = newUrl;
                                newStemsFile = file;
                            }}
                            clearInput={() => {
                                stemsUrl = null;
                                newStemsFile = null;
                            }}
                        />
                    </div>

                    <div class="abf_uploader">
                        <Mp3Uploader
                            format="wav"
                            label="Audio (WAV)"
                            dropzoneLabel="Add WAV"
                            maxFileSizeMB={100}
                            mp3Url={wavUrl}
                            fileName={newWavFile?.name ?? (wavUrl ? "Current WAV" : null)}
                            mp3Uploaded={({ mp3Url: newUrl, file }) => {
                                wavUrl = newUrl;
                                newWavFile = file;
                            }}
                            clearInput={() => {
                                wavUrl = null;
                                newWavFile = null;
                            }}
                            inputError={missingAudio && formSubmitted
                                ? "Upload a WAV, an MP3, or both."
                                : null}
                        />
                    </div>

                    <div class="abf_uploader">
                        <Mp3Uploader
                            label="Audio (MP3)"
                            {mp3Url}
                            fileName={newMp3File?.name ?? (mp3Url ? "Current MP3" : null)}
                            mp3Uploaded={({ mp3Url: newUrl, file }) => {
                                mp3Url = newUrl;
                                newMp3File = file;
                            }}
                            clearInput={() => {
                                mp3Url = null;
                                newMp3File = null;
                            }}
                            inputError={missingAudio && formSubmitted
                                ? "Upload a WAV, an MP3, or both."
                                : null}
                        />
                    </div>
                </div>

                <!-- download what's saved on this track -->
                <div class="abf_downloads">
                    <p class="abf_downloadsLabel">Download saved files</p>

                    <div class="abf_downloadButtons">
                        <!-- every saved file in one zip -->
                        <button
                            type="button"
                            class="abf_downloadButton abf_downloadButton_all"
                            disabled={!anythingSaved || !!downloading}
                            title="Download every saved file in one ZIP"
                            on:click={() => download("all", "all files")}
                        >
                            <DownloadArrowIcon height="15px" />
                            {downloading === "all" ? "Zipping…" : "Download all"}
                        </button>

                        {#each downloads as file}
                            <button
                                type="button"
                                class="abf_downloadButton"
                                disabled={!file.saved || !!downloading}
                                title={file.saved
                                    ? `Download the ${file.label.toLowerCase()}`
                                    : `No ${file.label.toLowerCase()} saved on this track`}
                                on:click={() => download(file.kind, file.label)}
                            >
                                <DownloadArrowIcon height="15px" />
                                {downloading === file.kind ? "Downloading…" : file.label}
                            </button>
                        {/each}
                    </div>
                </div>
            </section>

            <div class="abf_main">
                <!-- details -->
                <section class="abf_card">
                    <header class="abf_cardHeader">
                        <span class="abf_step">02</span>
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
                                        if (!v) return;

                                        // switching to a reference clears BPM, key, and mode
                                        if (v === "Reference" && form.trackType !== "Reference") {
                                            form.bpm = 0;
                                            form.key = null;
                                            form.mode = null;
                                        }

                                        form.trackType = v;
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
                        <span class="abf_step">03</span>
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
                                    clearable={true}
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
                                    clearable={true}
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
                                    clearable={true}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>


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
