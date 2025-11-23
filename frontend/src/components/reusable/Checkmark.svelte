<script lang="ts">
    import CheckIcon from "../svg/Icons/CheckIcon.svelte";

    export let isChecked: boolean = false
</script>

<div class="checkmarkBox" class:isChecked={isChecked}>
    <div class="wrapCheckIcon">
        <CheckIcon height={'13px'} color={'#222'}></CheckIcon>
    </div>

</div>

<style>
    .checkmarkBox {
        height: 12px;
        width: 12px;
        border: 1px solid rgba(211, 211, 211, 0.384);
        border-radius: 3px;
        position: relative;
    }
    .isChecked {
        background-color: #f7f7f7;
    }
    .wrapCheckIcon{
        position: absolute;
        top: 50%;
        left: 50%;
        padding-top: 3px;
        transform: translate(-50%, -50%);
    }
</style>