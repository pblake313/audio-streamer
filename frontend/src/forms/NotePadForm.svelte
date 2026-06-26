<script lang="ts">
    import { fade } from 'svelte/transition';
    import BoxButton from '../components/buttons/BoxButton.svelte';
    import { authorizedFetch } from '../helpers/Fetchers/authorizedFetch';
    import { destinationOptions } from '../lib/selectoptions';
    import type { Beat } from '../lib/types/Beats';
    import { upsertBeat } from '../stores/AudioPlayer/BeatsStore';
    import { isUpdatingBeatFromModal } from '../stores/BeatUpdatingStore';
    import { pushNotification } from '../stores/NotificationStore';
    import './NotePadForm.css';
    import MultiSelect from '../components/form-inputs/select/MultiSelect.svelte';
    import TextArea from '../components/form-inputs/text/TextArea.svelte';

    export let beat: Beat;
    export let onRatingUpdated: (() => void) | undefined;

    // 🔹 LOCAL copies – do NOT mutate `beat` directly
    let localNotepad: string = beat.notepad || '';
    let localFutureDestinations: string[] = [...(beat.futureDestinations || [])];

    let formTouched = false;

    async function saveNotepad() {
        if (!formTouched) return;

        const formData = {
            newNotepad: localNotepad,
            newDestinations: localFutureDestinations
        };

        try {
            isUpdatingBeatFromModal.set(true);

            const response = await authorizedFetch(
                `/secure/beats/update-notepad/${beat?.id}`,
                {
                    method: 'POST',
                    body: JSON.stringify(formData)
                }
            );

            if (response.updatedBeat) {
                // let parent close modal if it wants
                if (onRatingUpdated) {
                    onRatingUpdated();
                }

                // 🔹 update global store with the new beat
                upsertBeat(response.updatedBeat);
            } else {
                pushNotification(
                    'Beat updated successfully but no new beat was returned.',
                    'Error',
                    false,
                    1500,
                    'Update Beat Error'
                );
            }
        } catch (error: any) {
            console.log('[NotePadForm] error:', error);
            pushNotification(
                error.message || 'An unknown error has occurred.',
                'Error',
                false,
                1500,
                'Update Beat Error'
            );
        } finally {
            isUpdatingBeatFromModal.set(false);
        }
    }

    function handleDestinationsChange(v: string[]) {
        localFutureDestinations = v;
        formTouched = true;
    }

    function handleNotepadChange(v: string) {
        localNotepad = v;
        formTouched = true;
    }

    function handleSaveClick(event: MouseEvent) {
        event.preventDefault();
        saveNotepad();
    }
</script>

{#if !$isUpdatingBeatFromModal}
    <div in:fade={{ duration: 350 }}>
        <MultiSelect
            label={'Future Destinations'}
            onChange={handleDestinationsChange}
            options={destinationOptions}
            selected={localFutureDestinations}
            useAutoClose={true}
        />

        <div class="editBeatArea">
            <TextArea
                valueChanged={handleNotepadChange}
                value={localNotepad}
                label="Notepad"
                placeholder="Enter notes here..."
            />
        </div>

        <br />

        <div class="flexForSave">
            <div class="wrapSaveButton">
                <BoxButton
                    isDisabled={$isUpdatingBeatFromModal || !formTouched}
                    fullWidth={true}
                    buttonText="Save"
                    buttonStyle={'stayWhite'}
                    on:click={handleSaveClick}
                />
            </div>
        </div>
    </div>
{/if}
