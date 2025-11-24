<script lang="ts">
    import CloseIcon from "../svg/Icons/CloseIcon.svelte";
    import ThickCloseIcon from "../svg/Icons/ThickCloseIcon.svelte";

    export let buttonStyle: "standard" | "ghost" = "standard";
    export let tightPad: boolean = false;
    export let iconThickness: "thin" | "thick" = "thin";
    export let color = "#393939";
</script>

<button type="button" on:click class={buttonStyle} class:tighten={tightPad}>
    {#if iconThickness === "thin"}
        <CloseIcon height="20px" {color}></CloseIcon>
    {:else}
        <ThickCloseIcon height="25px" color={`#${color}`}></ThickCloseIcon>
    {/if}
</button>

<style>
    button {
        cursor: pointer;
        padding: 0px;
        width: 40px;
        height: 40px;
        -webkit-tap-highlight-color: transparent; /* Removes highlight on mobile */
    }
    .standard {
        background-color: transparent;
        border: none;
        outline: none;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: space-around;
        transition: 0.3s;
    }
    .standard:hover {
        cursor: pointer;
        background-color: #d8d8d85a;
        opacity: 1;
    }
    .ghost {
        background-color: transparent;
        border: none;
        outline: none;
        border-radius: 5px;
        display: flex;
        align-items: center;
        opacity: 0.7;
        justify-content: space-around;
        transition: 0.3s;
    }
    .ghost:hover {
        box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.183);
        opacity: 1;
    }
    .tighten {
        height: 25px;
        width: 25px;
    }
    .ghost.tighten:hover {
        box-shadow: 0px 0px 0px transparent;
    }
    @media (pointer: coarse) {
        .standard:hover {
            opacity: 1;
            box-shadow: none;
            background-color: transparent;
        }
        .ghost:hover {
            box-shadow: none;
            background-color: transparent;
            opacity: 1;
        }
    }
</style>
