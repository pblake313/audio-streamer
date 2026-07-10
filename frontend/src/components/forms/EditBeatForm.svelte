<script lang="ts">
    import "./EditBeatForm.css";

    import BoxButton from "../../components/buttons/BoxButton.svelte";
    import type { Beat } from "../../lib/types/Beats";
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import AddTrackPreview from "../previews/AddTrackPreview.svelte";
    import { onMount, tick } from "svelte";
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
    import {
        createValidEditBeatFormObject,
        editBeatFormError,
        setEditBeatFormError,
    } from "../../stores/EditBeatStore";
    import { upsertBeat } from "../../stores/AudioPlayer/BeatsStore";
    import { goto } from "$app/navigation";
    import { pushNotification } from "../../stores/NotificationStore";

    export let beat: Beat;

    let isUpdatingBeat: boolean = false;
    let formSubmitted: boolean = false;

    // files
    let newArtworkFile: File | null;
    let newMp3File: File | null;

    // initial file values
    let artworkUrl: string | null = beat.artworkUrl;
    let mp3Url: string | null = beat.mp3Url;

    let errorElement: HTMLParagraphElement | null = null;

    let form: {
        title: string | null;
        tagOne: string | null;
        tagTwo: string | null;
        customTagColor: string | null;
        customTag: string | null;
        mood: string | null;
        key: string;
        mode: string;
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
        bpm: beat.bpm,
    };

    onMount(() => {});

    $: if ($editBeatFormError) {
        scrollToError();
    }

    async function scrollToError() {
        await tick();

        if (!errorElement) return;

        const rect = errorElement.getBoundingClientRect();

        const isOnScreen = rect.bottom > 0 && rect.top < window.innerHeight;

        if (isOnScreen) return;

        window.scrollTo({
            top: Math.max(
                0,
                window.scrollY + rect.top - window.innerHeight * 0.5,
            ),
            behavior: "smooth",
        });
    }

    async function updateBeat() {
        try {
            formSubmitted = true;

            if (isUpdatingBeat) return;

            // validate beat obj.

            const validObj: FormData = createValidEditBeatFormObject(form);

            console.log(validObj);

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
            goto("/portal/manage-beats");
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

<AddTrackPreview
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
    deleteBeat={beat}
/>

<div class="ebf_container">
    <div class="ebf_formArea">
        <!-- LEFT -->
        <div class="ebf_detials">
            <div class="ebf_single">
                <TextInput
                    label={"Track Title"}
                    onTextChange={(v) => {
                        form.title = v;
                    }}
                    value={form.title}
                    inputError={formSubmitted && !form.title
                        ? "Missing Track Title"
                        : null}
                />
            </div>

            <div class="ebf_bpmKeyMode">
                <div class="ebf_bpm">
                    <BpmInput
                        bpmChanged={(v) => {
                            form.bpm = v;
                        }}
                        bpm={form.bpm}
                        inputError={formSubmitted && form.bpm <= 0
                            ? "Invalid BPM"
                            : null}
                    />
                </div>

                <div class="ebf_mode">
                    <SelectButton
                        onSelect={(v) => {
                            form.mode = v;
                        }}
                        selectedOption={form.mode}
                        label={"Mode"}
                        options={songModeOptions}
                        inputError={formSubmitted && !form.mode
                            ? "Missing Mode"
                            : null}
                    />
                </div>

                <div class="ebf_key">
                    <SelectButton
                        label={"Key"}
                        onSelect={(v) => {
                            form.key = v;
                        }}
                        options={songKeyOptions}
                        selectedOption={form.key}
                        inputError={formSubmitted && !form.key
                            ? "Missing Key"
                            : null}
                    />
                </div>
            </div>

            <div class="ebf_tagFlex">
                <div class="ebf_tag">
                    <SelectButton
                        label={"Tag One"}
                        selectedOption={form.tagOne}
                        options={tagOptions}
                        onSelect={(v) => {
                            form.tagOne = v;
                        }}
                    />
                </div>

                <div class="ebf_tag">
                    <SelectButton
                        label={"Tag Two"}
                        selectedOption={form.tagTwo}
                        options={tagOptions}
                        onSelect={(v) => {
                            form.tagTwo = v;
                        }}
                    />
                </div>
            </div>

            <div class="ebf_customTagFlex">
                <div class="ebf_customTag">
                    <TextInput
                        label={"Custom Tag"}
                        onTextChange={(v) => {
                            form.customTag = v;
                        }}
                        value={form.customTag}
                    />
                </div>

                <div class="ebf_color">
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

            <div class="ebf_tagFlex">
                <div class="ebf_tag">
                    <SelectButton
                        label={"Mood"}
                        selectedOption={form.mood}
                        onSelect={(v) => {
                            form.mood = v;
                        }}
                        options={beatMoodOptions}
                    />
                </div>

                <div class="ebf_tag">
                    <SelectButton
                        onSelect={(v) => {
                            form.trackType = v;
                        }}
                        label={"Track Type"}
                        selectedOption={form.trackType}
                        options={trackTypeOptions}
                        inputError={formSubmitted && !form.trackType
                            ? "Missing Track Type"
                            : null}
                    />
                </div>
            </div>
        </div>

        <!-- RIGHT -->
        <div class="ebf_files">
            <div class="ebf_uploder">
                <ImageUploader
                    label="Artwork"
                    imageUrl={artworkUrl}
                    fileName={artworkUrl}
                    fileUploaded={({ imageUrl: newUrl, file }) => {
                        artworkUrl = newUrl;
                        newArtworkFile = file;
                    }}
                    clearInput={() => {
                        artworkUrl = null;
                        newArtworkFile = null;
                    }}
                    inputError={!artworkUrl && !newArtworkFile && formSubmitted
                        ? "Missing Artwork"
                        : null}
                />
            </div>

            <div class="ebf_uploder">
                <Mp3Uploader
                    label="Audio File"
                    {mp3Url}
                    fileName={mp3Url}
                    mp3Uploaded={({ mp3Url: newUrl, file }) => {
                        mp3Url = newUrl;
                        newMp3File = file;
                    }}
                    clearInput={() => {
                        mp3Url = null;
                        newMp3File = null;
                    }}
                    inputError={!mp3Url && !newMp3File && formSubmitted
                        ? "Missing Audio File"
                        : null}
                />
            </div>

            <div class="ebf_submitButton">
                <BoxButton
                    buttonText={"Update Beat"}
                    fullWidth={true}
                    on:click={updateBeat}
                    isDisabled={isUpdatingBeat}
                    buttonIcon={isUpdatingBeat ? "loading" : null}
                />

                {#if $editBeatFormError}
                    <p class="ebf_error" bind:this={errorElement}>
                        {$editBeatFormError}
                    </p>
                {/if}
            </div>
        </div>
    </div>
</div>
