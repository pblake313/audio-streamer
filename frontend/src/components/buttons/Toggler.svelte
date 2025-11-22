<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    
    export let toggledOption: boolean = false;

    function toggle() {
        if (toggledOption) {
            dispatch('toggleToTrue');
        } else {
            dispatch('toggleToFalse');
        }
    }
</script>

<button class="toggle-button" on:click={toggle} class:active={toggledOption}>
    <div class="slider" class:active={toggledOption}></div>
</button>

<style>
    .toggle-button {
        width: 40px;
        height: 20px;
        background-color: #444444;
        border-radius: 15px;
        border: none;
        position: relative;
        cursor: pointer;
        outline: none;
        padding: 0;
        transition: background-color 0.3s ease;
    }

    .toggle-button.active {
        background-color: #c5c5c5; /* Green background when toggled on */
    }

    .slider {
        width: 16px;
        height: 16px;
        background-color: rgb(105, 105, 105);
        border-radius: 50%;
        position: absolute;
        top: 2px;
        left: 2px;
        transition: 0.3s ;
        box-shadow: 0px 0px 2px black;
    }

    .slider.active {

        transform: translateX(20px);
        background-color: white;
        transition: 0.3s ;

    }
</style>
