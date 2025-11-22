<script lang="ts">
    export let buttonText: string = "Enter Button Text"
</script>

<button class="tightButton" on:click>
    {buttonText}
</button>


<style>
    .tightButton {
        border: 1px solid #323232;
        border-radius: 50px;
        padding: 4px 10px;
        cursor: pointer;
        background-color: #323232;
        color: #f7f7f7;
        font-size: 9pt;

    }

</style>