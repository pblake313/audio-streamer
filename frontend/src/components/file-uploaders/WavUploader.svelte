<script lang="ts">
    import { createEventDispatcher, onDestroy } from 'svelte';
    import WaveSurfer from 'wavesurfer.js';
    import AddIcon from '../svg/Icons/AddIcon.svelte';
    import './WavUploader.css';
    import BoxButton from '../buttons/BoxButton.svelte';
    import PauseIcon from '../svg/Icons/PauseIcon.svelte';
    import PlayIcon from '../svg/Icons/PlayIcon.svelte';

    let fileInput: HTMLInputElement | null = null;
    let waveSurfer: WaveSurfer | null = null;
    let waveformContainer: HTMLElement | null = null;
    let isPlaying: boolean = false;

    export let placeHolder = 'Select File';
    export let wavUrl: string | null = null;
    export let fileName: string | null = null;
    export let inputError: string | null = null;
    export let label: string | null = null;
    export let file: File | null = null; // Exposed as a prop for parent access

    const dispatch = createEventDispatcher();

    // Generate a unique ID for each instance
    const uniqueId = `waveform-${Math.random().toString(36).substr(2, 9)}`;

    const handleFileChange = (event: Event) => {
        isPlaying = false;
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            file = target.files[0]; // Assign the selected file
            const acceptedTypes = ['audio/wav'];
            if (!acceptedTypes.includes(file.type)) {
                alert('Please upload a WAV file.');
                return;
            }

            fileName = file.name;
            wavUrl = URL.createObjectURL(file);

            dispatch('uploadedWav', { wavUrl, file });
        }
    };

    const initializeWaveSurfer = () => {
        if (waveSurfer) {
            waveSurfer.destroy();
        }

        if (waveformContainer && wavUrl) {
            waveSurfer = WaveSurfer.create({
                container: `#${uniqueId}`, // Use the unique ID
                waveColor: '#b9b9b9',
                progressColor: '#222222',
                backend: 'MediaElement',
                height: 40,
                barWidth: 2,
                hideScrollbar: true,
            });

            waveSurfer.load(wavUrl);
            waveSurfer.on('play', () => (isPlaying = true));
            waveSurfer.on('pause', () => (isPlaying = false));
        }
    };

    const togglePlayPause = (event: Event) => {
        event.stopPropagation(); // Stop the parent button click event
        if (waveSurfer) {
            if (waveSurfer.isPlaying()) {
                waveSurfer.pause();
            } else {
                waveSurfer.play();
            }
        }
    };

    const uploadFile = () => {
        if (fileInput) {
            fileInput.click();
        }
        inputError = null;
    };

    const resetInput = (event: Event) => {
        event.stopPropagation(); // Stop the parent button click event
        if (fileInput) {
            fileInput.value = '';
        }
        wavUrl = null;
        fileName = null;
        file = null; // Reset the file
        isPlaying = false;

        if (waveSurfer) {
            waveSurfer.destroy();
            waveSurfer = null;
        }

        dispatch('clearWav');
    };

    onDestroy(() => {
        if (waveSurfer) {
            waveSurfer.destroy();
        }
    });

    // Reactively initialize WaveSurfer when the `wavUrl` and `waveformContainer` are ready
    $: if (wavUrl && waveformContainer) {
        initializeWaveSurfer();
    }

    const stopPropagation = (event: Event) => {
        event.stopPropagation(); // Prevent parent click event from firing
    };
</script>

<input type="file" bind:this={fileInput} accept="audio/wav" on:change={handleFileChange} style="display: none;" />

<button class="waveUploadButton" class:openForWave={fileName} on:click={uploadFile} class:wavError={inputError && inputError !== ''}>
    {#if label}
        <p class="uploaderLabel">{label}</p>
    {/if}

    {#if !fileName}
        <div class="upbutFl">
            <AddIcon height={'16px'} color={inputError && inputError !== '' ? 'f94040' : '848484'}></AddIcon>
            <p class="nompuploadtext">{placeHolder}</p>
        </div>
    {:else}
        <div class="songPreviewWrap">
            <div class="waveprev">
                <p class="umptext"><span style="color: #848484;">Selected:</span> <em>{fileName}</em></p>
            </div>

            <BoxButton on:click={resetInput} tightPad={true} buttonStyle={'lightHouse'} buttonText={'Remove'}></BoxButton>
        </div>
    {/if}

    <div class="flexThePlayer" class:openPlayer={fileName}>
        <div class="wavePWRap">
            <button class="playpausUp" on:click={togglePlayPause}>
                {#if isPlaying}
                    <div class="wrapPPIcon">
                        <PauseIcon height={'14px'}></PauseIcon>
                    </div>
                    {:else}
                    <div class="wrapPPIcon">
                        <PlayIcon height={'14px'}></PlayIcon>
                    </div>
                {/if}
            </button>
        </div>

        <div class="wrapWavContain">
            <!-- Assign unique ID dynamically -->
            <button id={uniqueId} bind:this={waveformContainer} class="waver-container" on:click={stopPropagation}></button>
        </div>
    </div>
</button>
