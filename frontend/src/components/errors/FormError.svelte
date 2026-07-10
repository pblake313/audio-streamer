<script lang="ts">
    import AlertIcon from "../Icons/svg/AlertIcon.svelte";

    export let errorMessage: string | null = null;
    export let errorTitle: string | null = null;

    export let textAlign: "center" | "left" = "left";

    // text + icon use this same color
    export let color: string = "gold";
</script>

<div class="wrapFormError" style={`--form-error-color: ${color};`}>
    {#if errorTitle}
        <div
            class="errorTitleFlex"
            class:centerError={textAlign === "center"}
        >
            <AlertIcon color={color} height="20px" />

            <p class="formError_title">
                {errorTitle}
            </p>
        </div>
    {/if}

    {#if errorMessage}
        <div
            class="errorMessageFlex"
            class:centerError={textAlign === "center"}
        >
            {#if !errorTitle}
                <AlertIcon color={color} height="20px" />
            {/if}

            <p
                class="formError_message"
                class:messageWithIcon={!errorTitle}
            >
                {errorMessage}
            </p>
        </div>
    {/if}
</div>

<style>
    .wrapFormError {
        color: var(--form-error-color);
    }

    .errorTitleFlex,
    .errorMessageFlex {
        display: flex;
        align-items: center;
        margin-top: 10px;
    }

    .centerError {
        width: fit-content;
        margin-left: auto;
        margin-right: auto;
        text-align: center;
    }

    .formError_title {
        margin: 0;
        margin-left: 10px;

        color: var(--form-error-color);
        font-weight: 550;
        font-size: 14pt;
    }

    .formError_message {
        margin: 0;

        color: var(--form-error-color);
        opacity: 0.9;
        font-weight: 400;
        font-size: 12pt;
    }

    .messageWithIcon {
        margin-top: 0;
        margin-left: 10px;
    }
</style>