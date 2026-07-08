<script lang="ts">
    import { toggleAB } from "../../../stores/ABTestStore";
    import FolderNextIcon from "../../Icons/svg/FolderNextIcon.svelte";
    import SwapIcon from "../../Icons/svg/SwapIcon.svelte";
    import TrashIcon from "../../Icons/svg/TrashIcon.svelte";
    import "./ABToggler.css";

    export let height: string = "65px";
    export let iconHeight: string = "40px";
    export let color: string = "#f7f7f7";
    export let showRing: boolean = false;
    export let isDisabled: boolean = false;

    let isActive = false;

    function handleClick() {
        if (isDisabled) return;

        isActive = true;

        toggleAB();

        setTimeout(() => {
            isActive = false;
        }, 150);
    }
</script>

<button
    type="button"
    class="abToggler_main"
    class:abToggler_active={isActive}
    class:abToggler_showRing={showRing}
    disabled={isDisabled}
    aria-label="Switch A/B track"
    style={`height: ${height}; width: ${height};`}
    on:click={handleClick}
>
    <div
        class="abToggler_iconWrap"
        style={`height: ${iconHeight}; width: ${iconHeight}; color: ${color};`}
    >
        <SwapIcon color={color} height={iconHeight}/>
    </div>
</button>