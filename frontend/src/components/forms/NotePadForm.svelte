<script lang="ts">
    import { fade } from "svelte/transition";
    import "./NotePadForm.css";
    import type { Beat } from "../../lib/types/Beats";
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import TextArea from "../form-inputs/text/TextArea.svelte";
    import BoxButton from "../buttons/BoxButton.svelte";
    import { setPopupError } from "../../stores/PopupBeatStore";
    import { updateBeatNotepadInArray } from "../../stores/AudioPlayer/BeatsStore";

    export let beat: Beat;

    let isLoading: boolean = false;

    let localNotepad: string = beat.notepad || "";
    let formTouched: boolean = false;

    $: originalNotepad = beat.notepad || "";
    $: canSave = formTouched && localNotepad !== originalNotepad && !isLoading;

    async function saveNotepad() {
        if (!canSave) return;

        try {
            isLoading = true;

            const response = await authorizedFetch(
                `/secure/beats/update-notepad/${beat.id}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        newNotepad: localNotepad,
                    }),
                }
            );

            updateBeatNotepadInArray(beat.id, response.notepad);

            localNotepad = response.notepad || "";
            formTouched = false;
        } catch (error: any) {
            console.log(error);

            const errorMessage =
                error.message || "An unknown error has occurred.";

            setPopupError(errorMessage);
        } finally {
            isLoading = false;
        }
    }

    function handleNotepadChange(v: string) {
        localNotepad = v;
        formTouched = true;
    }
</script>

<div in:fade={{ duration: 350 }}>
    <div class="notpadForm_textarea">
        <TextArea
            valueChanged={handleNotepadChange}
            value={localNotepad}
            label="Notepad"
            placeholder="Enter notes here..."
        />
    </div>

    <div class="notepadForm_submitButton">
        <BoxButton
            isDisabled={!canSave}
            fullWidth={true}
            buttonIcon={isLoading ? "loading" : null}
            buttonText={isLoading ? "Saving..." : "Save"}
            on:click={saveNotepad}
        />
    </div>
</div>