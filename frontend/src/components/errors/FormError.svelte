<script lang="ts">
    import AlertIcon from "../Icons/svg/AlertIcon.svelte";

    export let errorMessage: string | null = null
    export let errorTitle: string | null = null  


    export let textAlign: 'center' | 'left' = 'left'
</script>


<div class="wrapFormError">

    {#if errorTitle}
        <div class="errorTitleFlex" class:squareUpError={textAlign === 'center'}>
            <AlertIcon  color={"#f7f7f7"} height="20px"></AlertIcon>
            <p class="formError_title">{errorTitle}</p>
        </div>
        
    {/if}

    {#if errorMessage}
        <div class="errorTitleFlex" class:squareUpMessage={textAlign === 'center'}>
            {#if !errorTitle}
                <AlertIcon color={"#f7f7f7"} height="20px"></AlertIcon>
            {/if}
            <p class="formError_title suberr" class:noETitle={!errorTitle}>{errorMessage}</p>
        </div>
        
    {/if}

</div>


<style>
    .formError_title {
        margin-left: 10px;
        color: var(--font-color-heading);
        font-weight: 550;
        font-size: 14pt;
    }
    .suberr{
        opacity: .8;
        margin-left: 0px;
        margin-top: 10px;
        font-weight: 400;
        font-size: 12pt;

    }
    .errorTitleFlex {
        display: flex;
        align-items: center;
        margin-top: 10px;
    }
    .squareUpError {
        width: fit-content;
        margin: auto;
    }
    .squareUpMessage {
        text-align: center;
        margin: auto;
        width: fit-content;
    }
    .noformError_title {
        margin-left: 10px;
    }
</style>