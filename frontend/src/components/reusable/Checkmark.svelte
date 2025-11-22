<script lang="ts">
    export let isChecked: boolean = false
</script>

<div class="checkmarkBox" class:isChecked={isChecked}></div>

<style>
    .checkmarkBox {
        height: 12px;
        width: 12px;
        border: 1px solid rgba(211, 211, 211, 0.384);
        border-radius: 3px;
    }
    .isChecked {
        background-color: white;
    }
</style>