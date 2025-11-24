<script lang="ts">
    import RewindFastForwardIcon from "../../Icons/svg/RewindFastForwardIcon.svelte";
    import { createEventDispatcher } from "svelte";
    import "./SeekButton.css";

    export let height = "50px";
    export let iconHeight = "16px";
    export let rewindOrForward: "rewind" | "fastforward" = "fastforward";

    export let uid: string = `${new Date().getTime() + Math.random()}`;

    export let isDisabled: boolean = false;

    const dispatch = createEventDispatcher();

    let isActive = false;

    function runAnimation() {
        const svgElement = document.getElementById(uid);

        dispatch("seek"); // Dispatch a 'click' event with playOrPause data

        if (svgElement) {
            svgElement.classList.add("is-clicked");
            setTimeout(() => {
                svgElement.classList.remove("is-clicked");
            }, 400); // Matches the duration of your animation
        }

        isActive = true;
        setTimeout(() => {
            isActive = false;
        }, 150);
    }
</script>

<button
    class="seekerButton"
    disabled={isDisabled}
    on:click={runAnimation}
    style="height: {height}; width: {height}"
    class:activeSeeker={isActive}
>
    <div class="iconWrap" class:rotateIcon={rewindOrForward === "rewind"}>
        <RewindFastForwardIcon {uid} height={iconHeight}
        ></RewindFastForwardIcon>
    </div>
</button>
