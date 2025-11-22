<script lang="ts">
    import './BoxButton.css'
    import AddIcon from "../svg/Icons/AddIcon.svelte";
    import CloseIcon from "../svg/Icons/CloseIcon.svelte";
    import FilterIcon from "../svg/Icons/FilterIcon.svelte";
    import MinusIcon from "../svg/Icons/MinusIcon.svelte";
    import MoreIcon from "../svg/Icons/MoreIcon.svelte";
    import ShareIcon from "../svg/Icons/ShareIcon.svelte";
    import TrashIcon from "../svg/Icons/TrashIcon.svelte";
  import DownloadIcon from "../svg/Icons/DownloadIcon.svelte";
    import SpinLoader from '../reusable/Loaders/SpinLoader.svelte';

    export let buttonText: string = 'Enter Button Text'
    export let buttonStyle: 'stockButton' | 'ghostButton' | 'lightHouse' | 'whiteButton' | 'stayWhite' | 'opacityIncrease' | 'whiteLightning' | 'danger' = 'stockButton'
    export let buttonIcon: 'add' | 'share' | 'close' | 'minus' | 'trash' | 'loading' | 'filter' | 'more' | 'download' | null = null // icons to select from
    export let tightPad: boolean = false // makes the button smaller
    export let shaking : boolean = false; //  prop for shaking animation
    export let fullWidth: boolean = false
    export let isDisabled: boolean = false
    export let noPad: boolean = false
    export let fontSize: string = '11pt'
    export let iconColor: string = 'ffffff'
    export let textColor: string = 'f7f7f7'
</script>

<button 
    class="{shaking ? `boxab ${buttonStyle} shake` : `boxab ${buttonStyle}`}" 
    on:click 
    type="button"
    class:tightPad={tightPad} 
    class:fullWidth={fullWidth} 
    class:noButtonPadding={noPad}
    disabled={isDisabled}
>
    <div class="innaFlex">
        {#if buttonIcon}
            <div class:wrapTheIcon={buttonText.trim() !== ''}>
                {#if buttonIcon === 'add'}
                    <div style="margin-top: 4px;">
                        <AddIcon height={'18px'} color={iconColor}></AddIcon>
                    </div>
                {/if}
                {#if buttonIcon === 'close'}
                    <div style="margin-top: 2px;">
                        <CloseIcon height={'18px'} color={iconColor}></CloseIcon>
                    </div>
                {/if}
                {#if buttonIcon === 'minus'}
                    <div style="margin-top: 3px;">
                        <MinusIcon color={iconColor}></MinusIcon>
                    </div>
                {/if}
                {#if buttonIcon === 'trash'}
                    <div style="margin-top: 3px;">
                        <TrashIcon color={iconColor} height={'18px'}></TrashIcon>
                    </div>
                {/if}
                {#if buttonIcon === 'filter'}
                    <div style="margin-top: 8px;">
                        <FilterIcon color={"f7f7f7"}></FilterIcon>
                    </div>
                {/if}
                {#if buttonIcon === 'download'}
                    <div style="margin-top: 3px;">
                        <DownloadIcon height={'20px'} color={iconColor}></DownloadIcon>
                    </div>
                {/if}
                {#if buttonIcon === 'share'}
                    <div style="margin-top: 3px;">
                        <ShareIcon height={'16px'}></ShareIcon>
                    </div>
                {/if}
                {#if buttonIcon === 'more'}
                    <div style="margin-top: 3px;">
                        <MoreIcon height={buttonText.trim() !== '' ? '16px' : '19px'}></MoreIcon>
                    </div>
                {/if}


                {#if buttonIcon === 'loading'}
                    <SpinLoader height={'24px'} color={buttonStyle === 'stockButton' ? '#ffffff' : '#000000'}></SpinLoader>
                {/if}
            </div>
            
        {/if}
  
        {#if buttonIcon !== 'loading'}
            <p class="fixa" style="white-space: nowrap; font-size: {fontSize}; ">{buttonText}</p>
        {/if}
    </div>
</button>

