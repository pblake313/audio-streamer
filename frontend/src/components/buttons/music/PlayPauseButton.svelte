<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import PauseIcon from "../../svg/Icons/PauseIcon.svelte";
    import PlayIcon from "../../svg/Icons/PlayIcon.svelte";

    export let height = "40px";
    export let playIconHeight = "30px";
    export let pauseIconHeight = "30px";
    export let showRing: boolean = false;
    export let color = "#393939";

    // ONLY controls which icon shows
    export let playOrPause: "play" | "pause" = "play";

    export let isDisabled: boolean = false;

    let isActive = false;

    const dispatch = createEventDispatcher();

    function handleClick() {
        if (isDisabled) return;

        isActive = true;
        dispatch("togglePlayPause", { playOrPause });

        setTimeout(() => (isActive = false), 150);
    }
</script>

<button
    on:click={handleClick}
    disabled={isDisabled}
    class="ppbutton"
    class:showRing={showRing}
    style={`height: ${height}; width: ${height};`}
    class:active={isActive}
>
    <div class="iconWrap">
        <!-- PLAY -->
        <div class="wrapplay" class:transpar={playOrPause !== "play"}>
            <PlayIcon
                color={color}
                height={playOrPause === "play" ? playIconHeight : "0px"}
            />
        </div>

        <!-- PAUSE -->
        <div class="wrappause" class:transpar={playOrPause !== "pause"}>
            <PauseIcon
                color={color}
                height={playOrPause === "pause" ? pauseIconHeight : "0px"}
            />
        </div>
    </div>
</button>

<style>
    .ppbutton {
        background-color: transparent;
        border-radius: 50px;
        position: relative;
        cursor: pointer;
        transition: background-color 0.3s ease, box-shadow 0.3s ease;
        margin: 0 5px;
        border: none;
        -webkit-tap-highlight-color: transparent;
    }

    .ppbutton:hover {
        background-color: rgba(255, 255, 255, 0.176);
    }

    .ppbutton.active:hover {
        background-color: rgba(255, 255, 255, 0.55);
    }

    .active {
        background-color: rgba(255, 255, 255, 0.55);
    }

    .showRing {
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    }

    .iconWrap {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .wrapplay,
    .wrappause {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
        transition:
            opacity 0.25s ease,
            transform 0.25s ease,
            height 0.25s ease;
        will-change: opacity, transform, height;
    }

    .wrapplay {
        padding-left: 5px;
    }

    .transpar {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
        pointer-events: none;
    }

    .ppbutton:disabled {
        opacity: 0.4;
        cursor: default;
        transition: opacity 0.5s ease 1s; /* duration: .5s, delay: 1s */
    }
    .ppbutton:disabled:hover {
        opacity: 0.2;
        background-color: transparent;
    }

    @media (pointer: coarse) {
        .ppbutton:hover {
            background-color: transparent;
        }
    }
</style>
