
<script lang="ts">
    import RightArrowIcon from "../Icons/svg/RightArrowIcon.svelte";


    export let nextPrev : 'next' | 'previous' = 'next'
    export let isDisabled: boolean = false
</script>

<button class="slideNavButton" on:click disabled={isDisabled}>
    <div class="wrapInnerP" class:roto={nextPrev === 'previous'}>
        <RightArrowIcon height={'16px'} color={'#222222'}></RightArrowIcon>
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
        background-color: rgba(211, 211, 211, 0.548);
    }
    .slideNavButton:hover {
        background-color: lightgray;

    }
    .wrapInnerP {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        height: fit-content;
        padding-top: 6px;

    }
    .roto{
        transform: translate(-50%, -50%) rotate(180deg);
        padding-top: 4px;
    }
    .slideNavButton:disabled {
        opacity: .2;
        cursor: auto;
    }
    @media(pointer: coarse){
        .slideNavButton:hover {
            background-color: rgba(211, 211, 211, 0.548);

        }
    }
</style>