<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import PauseIcon from '../../svg/Icons/PauseIcon.svelte';
    import PlayIcon from '../../svg/Icons/PlayIcon.svelte';

    export let height = '40px';
    export let playIconHeight = '30px';
    export let pauseIconHeight = '30px';
    export let showRing: boolean = false;
    export let color = '#393939';
    export let playOrPause: 'play' | 'pause' = 'play';
    export let isDisabled: boolean = false
    let isActive = false;

    // Create the event dispatcher
    const dispatch = createEventDispatcher();

    function handleClick() {
        isActive = true;
        dispatch('togglePlayPause', { playOrPause }); // Dispatch a 'click' event with playOrPause data
        setTimeout(() => {
            isActive = false;
        }, 150);
    }
</script>

<button
    on:click={handleClick}
    disabled={isDisabled}
    class="ppbutton"
    class:showRing={showRing}
    style="height: {height}; width: {height};"
    class:active={isActive}
>
    <div class="iconWrap">
        
            <div class="wrapplay" class:transpar={playOrPause !== 'play'}>
                <PlayIcon color={color} height={playOrPause === 'play' ? playIconHeight : '0px'}></PlayIcon>
            </div>
            <div class="wrappause" class:transpar={playOrPause === 'play'}>
                <PauseIcon color={color} height={playOrPause !== 'play' ? pauseIconHeight : '0px'}></PauseIcon>
            </div>
    </div>
</button>

<style>
    .ppbutton {
        background-color: transparent;
        border-radius: 50px;
        position: relative;
        cursor: pointer;
        transition: .4s;
        margin: 0px 5px;
        border: none;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0);
        color: #2222227e;
        -webkit-tap-highlight-color: transparent; /* Removes highlight on mobile */
    }
    .ppbutton:hover {
        opacity: 1;
        background-color: rgba(255, 255, 255, 0.176);

    }
    .ppbutton.active:hover {
        background-color: rgba(255, 255, 255, 0.559);
    }
    .active {
        background-color: rgba(255, 255, 255, 0.559);

    }
    .iconWrap {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }



    .showRing {
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
    }
    .wrapplay {
        padding-left: 5px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 1;
    }
    .wrappause {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 1;

    }
    .transpar {
        opacity: 0;
        color: #00ff00;
    }
    .ppbutton:disabled {
        opacity: .2;
    }
    .ppbutton:disabled:hover {
        opacity: .2;
    }
    @media (pointer: coarse) {
        .ppbutton:hover {
            opacity: 1;
            box-shadow: 0px 0px 15px rgba(0, 0, 0, 0);
            background-color: transparent;
        }
    }
</style>
