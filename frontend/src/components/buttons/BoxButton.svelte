<script lang="ts">
    import "./BoxButton.css";
    import CloseIcon from "../Icons/svg/CloseIcon.svelte";
    import MoreIcon from "../Icons/svg/MoreIcon.svelte";
    import SpinLoader from "../loaders/Loader.svelte";
    import AddIcon from "../Icons/svg/AddIcon.svelte";
    import TrashIcon from "../Icons/svg/TrashIcon.svelte";

    export let buttonText: string = "Enter Button Text";
    export let buttonStyle:
        | "stockButton"
        | "ghostButton"
        | "lightHouse"
        | "whiteButton"
        | "stayWhite"
        | "opacityIncrease"
        | "whiteLightning"
        | "danger" = "stockButton";
    export let buttonIcon:
        | "add"
        | "close"
        | "minus"
        | "trash"
        | "loading"
        | "more"
        | null = null; // icons to select from
    export let tightPad: boolean = false; // makes the button smaller
    export let shaking: boolean = false; //  prop for shaking animation
    export let fullWidth: boolean = false;
    export let isDisabled: boolean = false;
    export let noPad: boolean = false;
    export let fontSize: string = "11pt";
    export let iconColor: string = "ffffff";
</script>

<button
    class={shaking ? `boxab ${buttonStyle} shake` : `boxab ${buttonStyle}`}
    on:click
    type="button"
    class:tightPad
    class:fullWidth
    class:noButtonPadding={noPad}
    disabled={isDisabled}
>
    <div class="innaFlex">
        {#if buttonIcon}
            <div class:wrapTheIcon={buttonText.trim() !== ""}>
                {#if buttonIcon === "add"}
                    <div style="margin-top: 4px;">
                        <AddIcon height={"18px"} color={iconColor}></AddIcon>
                    </div>
                {/if}
                {#if buttonIcon === "close"}
                    <div style="margin-top: 2px;">
                        <CloseIcon height={"18px"} color={iconColor}
                        ></CloseIcon>
                    </div>
                {/if}
                {#if buttonIcon === "trash"}
                    <div style="margin-top: 3px;">
                        <TrashIcon color={iconColor} height={"18px"}
                        ></TrashIcon>
                    </div>
                {/if}

                {#if buttonIcon === "more"}
                    <div style="margin-top: 3px;">
                        <MoreIcon
                            height={buttonText.trim() !== "" ? "16px" : "19px"}
                        ></MoreIcon>
                    </div>
                {/if}

                {#if buttonIcon === "loading"}
                    <SpinLoader
                        height={"24px"}
                        color={buttonStyle === "stockButton"
                            ? "#ffffff"
                            : "#000000"}
                    ></SpinLoader>
                {/if}
            </div>
        {/if}

        {#if buttonIcon !== "loading"}

                {buttonText}
        {/if}
    </div>
</button>
