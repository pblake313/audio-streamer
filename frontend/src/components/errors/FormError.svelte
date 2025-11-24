<script lang="ts">
    import AlertIcon from "../Icons/svg/AlertIcon.svelte";

    export let errorMessage: string | null = null
    export let errorTitle: string | null = null  


    export let textAlign: 'center' | 'left' = 'left'
</script>


<div class="wrapFormError">

    {#if errorTitle}
        <div class="errorTitleFlex" class:squareUpError={textAlign === 'center'}>
            <AlertIcon  color={"#f7f7f7"} height="24px"></AlertIcon>
            <p class="eTitle" ><b>{errorTitle}</b></p>
        </div>
        
    {/if}

    {#if errorMessage}
        <div class="errorTitleFlex" class:squareUpMessage={textAlign === 'center'}>
            {#if !errorTitle}
                <AlertIcon color={"#f7f7f7"} height="24px"></AlertIcon>
            {/if}
            <p class="eTitle suberr" class:noETitle={!errorTitle}>{errorMessage}</p>
        </div>
        
    {/if}

</div>


<style>
    .eTitle {
        margin-left: 10px;
        color: #a5a5a5;
    }
    .suberr{
        opacity: .8;
        margin-left: 0px;
        margin-top: 10px;

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
    .noETitle {
        margin-left: 10px;
    }
</style>