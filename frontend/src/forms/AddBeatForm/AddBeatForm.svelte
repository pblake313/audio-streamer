<script lang="ts">
    import TextInput from "../../components/form-inputs/TextInput.svelte";
    import './AddBeatForm.css'
    import ImageUploader from "../../components/file-uploaders/ImageUploader.svelte";
    import { pushNotification } from "../../stores/NotificationStore";
    import { onMount } from 'svelte';
    import { getSocket } from '../../stores/socketStore';
    import SelectButton from "../../components/form-inputs/SelectButton.svelte";
    import BoxButton from "../../components/buttons/BoxButton.svelte";
    import Mp3Uploader from "../../components/file-uploaders/Mp3Uploader.svelte";
    import BackendStatusBlock from "../../components/reusable/BackendStatusBlock.svelte";
    import { buildFormData, validateAddBeatForm } from "./AddBeatHelpers";
    import BpmInput from "../../components/form-inputs/BpmInput.svelte";
    import ColorSelect from "../../components/form-inputs/ColorSelect.svelte";
    import AddTrackPreview from "../../components/previews/AddTrackPreview.svelte";
    import { beatMoodOptions, colorOptions, songKeyOptions, songModeOptions, tagOptions } from "../../lib/selectoptions";
    import AudioLoader from "../../components/reusable/Loaders/AudioLoader.svelte";
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import { upsertBeat } from "../../stores/AudioPlayer/beatArrayStore";
    import { goto } from "$app/navigation";
    import { audioPlayerState } from "../../stores/AudioPlayerStore";


    let socket: any;

    let shaking: boolean = false;
    let formSubmitted = false;
    let isLoading = false;

    // form values
    let title: string = '';
    let tagOne: string = '';
    let tagTwo: string = '';
    let mood: string = ''
    let customTag: string = ''
    let customTagColor: string = ''
    let key: string = 'C';
    let mode: string = 'Minor'
    let bpm: number = 0; 
    let artworkFile: File | null = null;
    let mp3File: File | null = null;

    // temporary things for preview
    let temporaryArtUrl: string | null = null;
    let temporaryMp3Url: string | null = null;

    let beatUploadStatus: string | null = null;
    let artUploadStatus: 'Waiting' | 'Uploading' | 'Upload Success' = 'Waiting';
    let mp3UploadStatus: 'Waiting' | 'Uploading' | 'Upload Success' = 'Waiting';

    onMount(async () => {
        socket = await getSocket(); // Get the singleton socket instance

        if (socket && typeof socket.on === 'function') {
            socket.on('uploadStatus', (status: string) => {
                beatUploadStatus = status;

            });
            socket.on('uploadStarted', (status: string) => {
                if (status === 'artwork'){
                    artUploadStatus = 'Uploading'
                }
                if (status === 'mp3'){
                    mp3UploadStatus = 'Uploading'
                }
            })
            socket.on('uploadComplete', (status: string) => {
                if (status === 'artwork'){
                    artUploadStatus = 'Upload Success'
                }
                if (status === 'mp3'){
                    mp3UploadStatus = 'Upload Success'
                }
            })
        }
    });

    function resetUploadStatuses(){
        artUploadStatus = 'Waiting'
        mp3UploadStatus = 'Waiting'
    }

    async function addBeat() {
        formSubmitted = true;

        const addBeatFormIsValid = validateAddBeatForm(title, bpm, artworkFile, mp3File, key, mode)

        if (!addBeatFormIsValid) {
            shake();
            return;
        }

        let formData = buildFormData({title, tagOne, tagTwo, mood, bpm, artworkFile, mp3File, key, mode, customTag, customTagColor});

        isLoading = true;


        try {
            beatUploadStatus = 'Sending data...';

            const socketId = socket.id;

            const response = await authorizedFetch('/secure/beats/add-beat', {
                method: 'POST',
				headers: {
                    'x-socket-id': socketId
				},
                body: formData
            })

            // console.log(response)

            if (response.newBeat){
                upsertBeat(response.newBeat)
                pushNotification('Beat added successfully!', "Success", false, 1500, 'New Beat Created')
                goto('/portal/manage-beats')

            } else {
                pushNotification('There was a successful response, but no new beat was returned.', 'Error', false, 5000, 'Add Beat Error')
            }

        } catch (error: any) {

            if (error.message) pushNotification(error.message || 'An unknown error has occurred.', 'Error', false, 5000, 'Add Beat Error')
            // console.log(error)
        } finally {
            isLoading = false;
            beatUploadStatus = null;
            resetUploadStatuses()
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
            bpm={bpm}
            key={key}
            mode={mode}
            tagOne={tagOne}
            tagTwo={tagTwo}
            title={title}
            mood={mood}
            customTag={customTag}
            customTagColor={customTagColor}
            heading={'Add Track'}
        ></AddTrackPreview>
    </div>


    <div class="beatFormSide">
        {#if isLoading}
            <AudioLoader backgroundColor={'#323232'}></AudioLoader>

            {#if artUploadStatus}
                <BackendStatusBlock title={'Artwork Status'} status={artUploadStatus} ></BackendStatusBlock>
            {/if}
            {#if mp3UploadStatus}
                <BackendStatusBlock title={'MP3 Status'} status={mp3UploadStatus} ></BackendStatusBlock>
            {/if}

            {#if beatUploadStatus}
                <p style="font-size: 9pt; text-align: center;">{beatUploadStatus}</p>
            {/if}
        {:else}
     

            <div class="addBeatForm" class:padFormForPlayer={$audioPlayerState !== 'Idle'}>

                <div class="addBeatHalf">
                    <div class="whh">
                        <p><b>Track Details</b></p>
                    </div>
                    <div class="wrapFIn">
                        <TextInput 
                            value={title} 
                            label={'Beat Title'} 
                            inputError={formSubmitted && !title? 'Enter a valid beat title.' : null} 
                            onTextChange={(v) => title = v}
                            maxlength={50}
                        />
                    </div>
                
                    <div class="tagsFlex">
                        <div class="addBpmSel">
                            <BpmInput
                                bpmChanged={(v) => bpm = v}
                                inputError={formSubmitted && !bpm ? "Number between 1 and 199." : null}
                                bpm={bpm}
                            />
                        </div>


                        <div class="keySelect">
                            <SelectButton 
                                onSelect={(v) => key = v}
                                label={'Key'} 
                                id={'songKey'} 
                                selectedOption={key} 
                                options={songKeyOptions}
                            />
                        </div>

                        <div class="modeSelect">
                            <SelectButton 
                                label={'Mode'} 
                                id={'songMode'} 
                                selectedOption={mode} 
                                options={songModeOptions}
                                onSelect={(v) => mode = v}
                            />

                        </div>
                  
                    </div>


                    <div class="whh">
                        <p><b>Files</b></p>
                    </div>
                    <div class="wrapFIn">
                        <ImageUploader 
                            fileUploaded={(v) => {
                                artworkFile = v.file;
                                temporaryArtUrl = v.imageUrl;
                            }}
                            clearInput={() => {
                                artworkFile = null;
                                temporaryArtUrl = null;
                            }}
                            inputError={formSubmitted && !artworkFile ? 'Please upload an artwork image.' : null} 
                            label={'Artwork'} 
                            fileName={artworkFile?.name}
                        />
                    </div>

                    <div class="wrapFIn">
                        <Mp3Uploader 
                            label={'File Preview (MP3)'}
                            mp3Url={temporaryMp3Url} 
                            fileName={mp3File?.name} 
                            inputError={formSubmitted && !mp3File ? 'Upload track audio file.' : ''}
                            mp3Uploaded={(v) => {
                                mp3File = v.file;
                                temporaryMp3Url = v.mp3Url
                            }}
                            clearInput={() => {
                                mp3File = null;
                                temporaryMp3Url = null

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
                                label={'Custom Tag'}
                                onTextChange={(v) => customTag = v}
                                value={customTag}
                                maxlength={35}
                            />
                        </div>
                        <div class="customColor">
                            <ColorSelect
                                onSelect={(v) => customTagColor = v}
                                label={'Tag Color'}
                                selectedOption={customTagColor}
                                colorOptions={colorOptions}
                            />
                        </div>
                    </div>


                    <div class="tagsFlex">

                        <div class="tagHalf">
                            <SelectButton 
                                onSelect={(v) => tagOne = v}
                                options={tagOptions} 
                                id={'tagNoOne'} 
                                label={'Tag One'} 
                                selectedOption={tagOne}
                            />
                        </div>


                        <div class="tagHalf">
                            <SelectButton 
                                onSelect={(v) => tagTwo = v}
                                options={tagOptions} 
                                id={'tagNoTwo'} 
                                label={'Tag Two'}  
                                selectedOption={tagTwo}
                            />
                  
                        </div>
                 
            
                    </div>


                    <SelectButton 
                        options={beatMoodOptions}
                        label='Mood'
                        onSelect={(v) => mood = v}
                        selectedOption={mood}
                    />

                </div>

            </div>

                       
            {#if $audioPlayerState !== 'Idle'}
                <div class="mobilePadder" ></div>
            {/if}

            <div class="wrapAddBeatSub" class:padforPlayer={$audioPlayerState !== 'Idle'}>
                <div class="innerSubmitButton">
                    <BoxButton buttonIcon={'add'} {shaking} on:click={addBeat} buttonText={'Add Beat'} fullWidth={true}></BoxButton>
                </div>
            </div>

    
        {/if}
    </div>


</div>


