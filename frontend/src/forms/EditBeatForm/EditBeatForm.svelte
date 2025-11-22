<script lang="ts">
    import TextInput from '../../components/form-inputs/TextInput.svelte';
    import ImageUploader from '../../components/file-uploaders/ImageUploader.svelte';
    import './EditBeatForm.css';
    import { onMount } from 'svelte';
    import { pushNotification } from '../../stores/NotificationStore';
    import { getSocket } from '../../stores/socketStore';
    import SelectButton from '../../components/form-inputs/SelectButton.svelte';
    import { beatMoodOptions,  colorOptions,  destinationOptions, songKeyOptions, songModeOptions, tagOptions } from '$lib/selectoptions';
    import BoxButton from '../../components/buttons/BoxButton.svelte';
    import Mp3Uploader from '../../components/file-uploaders/Mp3Uploader.svelte';
    import BackendStatusBlock from '../../components/reusable/BackendStatusBlock.svelte';
    import BpmInput from '../../components/form-inputs/BpmInput.svelte';
    import { createEditBeatFormData } from './EditBeatFormHelpers';
    import ColorSelect from '../../components/form-inputs/ColorSelect.svelte';
    import MultiSelect from '../../components/form-inputs/MultiSelect.svelte';
    import type { Beat } from '../../lib/types/Beats';
    import AddTrackPreview from '../../components/previews/AddTrackPreview.svelte';
    import AudioLoader from '../../components/reusable/Loaders/AudioLoader.svelte';
    import { authorizedFetch } from '../../helpers/Fetchers/authorizedFetch';
    import { audioPlayerState } from '../../stores/AudioPlayerStore';
    import { upsertBeat } from '../../stores/AudioPlayer/beatArrayStore';
    import { goto } from '$app/navigation';
    import TrashIcon from '../../components/svg/Icons/TrashIcon.svelte';
    import { deleteBeat } from '../../stores/EditBeatStore';
  
    const backendLink = import.meta.env.VITE_BACKEND_URL;
  
    export let beatCopy: Beat;
    
    let socket: any;

    // for previews
    let temporaryArtworkUrl: string | null = null
    let temporaryMp3PreviewUrl: string | null = null

    // form status
    let shaking: boolean = false;
    let formSubmitted: boolean = false;

    // loading status
    let artUploadStatus: 'Waiting' | 'Uploading' | 'Upload Success' = 'Waiting';
    let mp3UploadStatus: 'Waiting' | 'Uploading' | 'Upload Success' = 'Waiting';
    let loadingStatusText : string | null = null

    let isLoading: boolean = true;
    let updatingBeat: boolean = false
  

    // temporary variables for file uploaders

    let newMp3File: File | null = null
    let newArtworkFile: File | null = null;
  
    onMount(async () => {
        setTemporaryFiles()
        socket = await getSocket();
        if (socket && typeof socket.on === 'function') {
            socket.on('updateStatus', (status: string | null)  => {
                loadingStatusText = status
            })
            socket.on('uploadStarted', (status: string) => {
                if (status === 'artwork') {
                    artUploadStatus = 'Uploading'
                }
                if (status === 'mp3') {
                    mp3UploadStatus = 'Uploading'
                }
            })
            socket.on('uploadComplete', (status: string) => {
                if (status === 'artwork') {
                    artUploadStatus = 'Upload Success'
                }
                if (status === 'mp3') {
                    mp3UploadStatus = 'Upload Success'
                }
            })
        }
    });

    function setTemporaryFiles() {
        temporaryArtworkUrl = beatCopy.artworkUrl
        temporaryMp3PreviewUrl = beatCopy.mp3previewUrl
    }


    function isValidForm():boolean{
        if (!beatCopy.beatTitle || !beatCopy.bpm || (beatCopy.bpm <= 0 || beatCopy.bpm >= 200) || !beatCopy.key || !temporaryArtworkUrl || !temporaryMp3PreviewUrl){
            return false
        }

        return true
    }

    // setting values
    function resetUploadStatuses(){
        artUploadStatus = 'Waiting';
        mp3UploadStatus = 'Waiting';
    }

    async function updateBeat() {
        formSubmitted = true;

        if (!isValidForm()){
            shake()
            return
        }

        // create the formdata.
        const formData = createEditBeatFormData({
            tagOne: beatCopy.tagOne,
            tagTwo: beatCopy.tagTwo,
            mood: beatCopy.mood,
            key: beatCopy.key,
            mode: beatCopy.mode,
            beatTitle: beatCopy.beatTitle,
            bpm: beatCopy.bpm,
            newArtworkFile,
            newMp3File,
            customTag: beatCopy.customTag || '',
            customTagColor: beatCopy.customTagColor || '',
            futureDestinations: beatCopy.futureDestinations || []
        });

        try {
            loadingStatusText = 'Validating Request'
            updatingBeat = true;

            const socketId = socket.id;

            const response = await authorizedFetch(`/secure/beats/update-beat/${beatCopy.id}`, {
                method: 'POST',
                headers: {
                    'x-socket-id': socketId,
                },
                body: formData
            })
            console.log(response) 

            if (response.updatedBeat) {
                upsertBeat(response.updatedBeat)
                pushNotification('Beat updated successfully.', 'Success', false, 1500, 'Updated!')
            } else {
                pushNotification('The beat returned a successful response, but an updated beat wasnt returned.', 'Error', false, 5000, 'Returned Beat Error')
            }

            goto('/portal/manage-beats')

    
        } catch (err: any) {
            console.log(err)
            pushNotification(err.message || 'An unknown error has occurred.', 'Error', false, 5000, 'Edit Beat Error')
        } finally {
            resetUploadStatuses() // reset status texts....
            updatingBeat = false;
        }
    }

    // shaking 
    function shake() {
        shaking = true;
        setTimeout(() => {
            shaking = false;
        }, 600); // reset shaking
    }

    function handleKeySelect(value: string) {
        beatCopy.key = value as Beat['key'];
    }
    function handleModeSelect(value: string) {
        beatCopy.mode = value as Beat['mode'];
    }

    async function removeBeat(beatId:string) {
        try {
            updatingBeat = true
            await deleteBeat(beatId)
        } catch (err) {

        } finally {
            updatingBeat = false
        }
    }

</script>


<!-- preview -->
<div class="wrapEditPreview">

    <AddTrackPreview 
        heading={`Edit Track - ${beatCopy.beatTitle}`}
        albumUrl={temporaryArtworkUrl}
        bpm={beatCopy.bpm}
        key={beatCopy.key}
        mode={beatCopy.mode}
        tagOne={beatCopy.tagOne}
        tagTwo={beatCopy.tagTwo}
        title={beatCopy.beatTitle}
        mood={beatCopy.mood}
        customTag={beatCopy.customTag}
        customTagColor={beatCopy.customTagColor}
        futureDestinations={beatCopy.futureDestinations}
    ></AddTrackPreview>
</div>


{#if !updatingBeat}
    <div class="deleteBeatArea">
        <BoxButton on:click={() => {removeBeat(beatCopy.id)}} buttonIcon={'trash'} buttonText={'Delete Track'} buttonStyle={'danger'}  noPad={true} iconColor={'c30d0d'}></BoxButton>
    </div>
{/if}


<div class="editFormWrapper">

    {#if !updatingBeat}

        <div class="editAreaFlex" class:paddFormForPlay={$audioPlayerState !== 'Idle'}>

            <!-- left side -->
            <div class="halfEdit">
                <div class="holdHeadings">
                    <p><b>Track Details</b></p>
                </div>
                <div class="singleEditInput">
                    <TextInput 
                        value={beatCopy.beatTitle}
                        inputError={formSubmitted && !beatCopy.beatTitle ? 'Please enter a beat title.' : null} 
                        onTextChange={(v) => {beatCopy.beatTitle = v}}
                        label='Beat Title'
                        maxlength={50}
                    />
                </div>


                <div class="trackDetailsInputFlex">
                    <div class="wrapbpmJ">
                        <BpmInput
                            bpmChanged={(v) => {beatCopy.bpm = v}}
                            bpm={beatCopy.bpm ? beatCopy.bpm : 0}
                            inputError={formSubmitted && (!beatCopy.bpm || (beatCopy.bpm <= 0 || beatCopy.bpm >= 200)) ? 'A number between 1 and 199.' : null}
                        />
                    </div>
                    <div class="wrapkeyJoint">

                        <SelectButton 
                            onSelect={(v) => {
                                handleKeySelect(v)
                            }}
                            selectedOption={beatCopy.key} 
                            inputError={formSubmitted && !beatCopy.key ? 'Missing' : null} 
                            options={songKeyOptions} 
                            label={'Key'} 
                        />
                    </div>

                    <div class="wrapModeJoint">
                        <SelectButton  
                            onSelect={(v) => {
                                handleModeSelect(v)
                            }}
                            selectedOption={beatCopy.mode} 
                            inputError={formSubmitted && !beatCopy.mode ? 'Missing' : ''} 
                            options={songModeOptions} 
                            label={'Mode'} 
                        />
                    </div>
                </div>

                <div class="singleEditInput">

                    <ImageUploader
                        fileName={beatCopy.artworkUrl}
                        imageUrl={temporaryArtworkUrl}
                        label={'Album Artwork'}
                        clearInput={()=> {
                            newArtworkFile = null;
                            temporaryArtworkUrl = null
                        }}
                        fileUploaded={(v) => {
                            temporaryArtworkUrl = v.imageUrl
                            newArtworkFile = v.file;
                        }}
                        inputError={formSubmitted && !temporaryArtworkUrl ? 'Please upload an artowrk file.' : null} 
                    />

                </div>

     

                <div class="singleEditInput">


                    <Mp3Uploader 
                        label={'Beat Preview (MP3)'}
                        mp3Uploaded={(v) => {
                            newMp3File = v.file;
                            temporaryMp3PreviewUrl = v.mp3Url;
                        }}
                        clearInput={()=> {
                            temporaryMp3PreviewUrl = null
                            newMp3File = null
                        }}
                        fileName={temporaryMp3PreviewUrl}
                        inputError={formSubmitted && !temporaryMp3PreviewUrl ? 'Please upload an audio file.' : null} 

                    />

                </div>
         
            </div>


            <!-- right side -->
            <div class="halfEdit">
                <div class="holdHeadings">
                    <p><b>Tags</b></p>
                </div>
                <div class="editInputsFlex">
                    <div class="goHalfRightEdit">
                        <TextInput
                            onTextChange={(v) => {
                                beatCopy.customTag = v
                            }}
                            label={'Custom Tag'}
                            value={beatCopy.customTag || ''}
                            maxlength={35}
                        />
                    </div>
                    <div class="goHalfRightEdit">
                        <ColorSelect
                            label={'Custom Tag Color'}
                            onSelect={(v) => {beatCopy.customTagColor = v}}
                            selectedOption={beatCopy.customTagColor}
                            colorOptions={colorOptions}
                        />
                    </div>
                </div>

                <div class="editInputsFlex">
                    <div class="goHalfRightEdit">
                        <SelectButton 
                            onSelect={(v) => {
                                beatCopy.tagOne = v
                            }}
                            selectedOption={beatCopy.tagOne} 
                            options={tagOptions} 
                            label={'Tag One'}
                        />
                    </div>
                    <div class="goHalfRightEdit">
                        <SelectButton 
                            onSelect={(v) => {
                                beatCopy.tagTwo = v
                            }}
                            selectedOption={beatCopy.tagTwo} 
                            options={tagOptions} 
                            label={'Tag Two'}
                        />
                    </div>
                </div>

                <div class="editInputsFlex">
                    <div class="goHalfRightEdit">
                        <SelectButton 
                            onSelect={(v) => {
                                beatCopy.mood = v
                            }}
                            options={beatMoodOptions}
                            label={'Mood'} 
                            selectedOption={beatCopy.mood}
                        />
                    </div>
                    <div class="goHalfRightEdit">
                        <MultiSelect 
                            label={'Future Destination'} 

                            onChange={(v) => {
                                beatCopy.futureDestinations = v
                            }}
                            selected={beatCopy.futureDestinations} 
                            options={destinationOptions} 
                        />
                    </div>
                </div>





            </div>
        </div>

        <div class="wrapAddBeatSub" class:padforPlayer={$audioPlayerState !== 'Idle'}>
            <div class="innerSubmitButton">
                <BoxButton {shaking} on:click={updateBeat} buttonText={'Update'} fullWidth={true}></BoxButton> 
            </div>
        </div>


    {:else} <!-- if THE Form IS LOADING. -->
    
        {#if newArtworkFile}
            <BackendStatusBlock title={'New Artwork Upload Status'} status="{artUploadStatus}"></BackendStatusBlock>
        {/if}
        {#if newMp3File}
            <BackendStatusBlock title={'New MP3 Preview Upload Status'} status="{mp3UploadStatus}"></BackendStatusBlock>
        {/if}
        <div style="margin: auto;">
            <AudioLoader backgroundColor={"#222222"}></AudioLoader>
            {#if loadingStatusText}
                <br>
                <p style="text-align: center; font-size: 11pt;">{loadingStatusText}</p>
            {/if}
        </div>

    {/if}



</div>
    

