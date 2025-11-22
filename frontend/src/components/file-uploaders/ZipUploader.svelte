<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import AddIcon from '../svg/Icons/AddIcon.svelte';
    import BoxButton from '../buttons/BoxButton.svelte';
    import './ZipUploader.css'

    export let inputError: string = ''

    export let placeHolder = 'Upload Zip File';
    export let label: string | null = null
    let fileInput: HTMLInputElement | null = null;
    
    export let imageUrl: string | null = null;
    export let fileName: string | null = null;

    const dispatch = createEventDispatcher();

    const handleZipChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            // Check if the file type is accepted
            const acceptedTypes = ['application/zip', 'application/x-zip-compressed'];
            if (!acceptedTypes.includes(file.type)) {
                alert('Please upload a ZIP file.');
                return;
            }

            // Update fileName with the selected file's name
            fileName = file.name;

            dispatch('uploadedFile', { file }); 
        }
    };

    const uploadFile = () => {
        if (fileInput) {
            fileInput.click();
        }
    };

    const resetInput = () => {
        if (fileInput) {
            fileInput.value = '';
        }
        imageUrl = null;
        fileName = null;

        dispatch('clearInput');
    };

    
</script>

<input type="file" bind:this={fileInput} accept=".zip,application/zip" on:change={handleZipChange} style="display: none;" />


<div style="margin-bottom: 20px;">
    {#if fileName}
        <button class="uppabutta bwithup" on:click={uploadFile}>
 

            {#if label}
                <p class="uploaderLabel">{label}</p>
            {/if}


            <div class="remoBox">
                <div class="flexuptext">
                    <p class="upfilenametedxt"><span style="color: #848484;">Selected:</span> <em>{fileName}</em></p>
                </div>

                <BoxButton on:click={resetInput} tightPad={true} buttonText={'Remove'} buttonStyle={'lightHouse'}></BoxButton>
                
            </div>
    
        </button>
    {:else}
        <button class="uppabutta" on:click={uploadFile} class:error={inputError !== ''}>
            
            {#if label}
                <p class="uploaderLabel">{label}</p>
            {/if}

            <div class="abf">
                <AddIcon color={inputError !== '' ? 'f94040' : '848484'} height={'16px'}></AddIcon>
                <p class="noUploadText">{placeHolder}</p>
            </div>
        </button>
    {/if}
</div>
