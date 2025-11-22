
<script lang="ts">
    import Pointer from "../svg/Icons/Pointer.svelte";

    export let nextPrev : 'next' | 'previous' = 'next'
</script>

<button class="slideNavButton" on:click>
    <div class="wrapInnerP" class:roto={nextPrev === 'previous'}>
        <Pointer height={'16px'}></Pointer>
    </div>
</button>

<style>
    .slideNavButton {
        padding: 0px;
        margin: 0px;
        height: 35px;
        width: 35px;
        border-radius: 50%;
        overflow: hidden;
        position: relative;
        border: none;
        cursor: pointer;
        transition: .3s;
    }
    .slideNavButton:hover {
        background-color: #c6c6c657;

    }
    .wrapInnerP {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        height: fit-content;
        padding-top: 3px;
    }
    .roto{
        transform: translate(-50%, -50%) rotate(180deg);
    }
    @media(pointer: coarse){
        .slideNavButton:hover {
            background-color: transparent;

        }
    }
</style>