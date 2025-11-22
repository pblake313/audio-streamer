<script lang="ts">
  import type { Beat } from "../../lib/types/Beatseats";

    export let buttonType: 'WAV File' | 'Stems'
    export let beat: Beat
    export let inCart: boolean = false
</script>

<button class="priceOpButton" on:click class:buttonforCart={inCart}>

    <div class="wrapinnerB">
        <p class="beatPriceOpTitle"><b>{buttonType}</b></p>

        {#if buttonType === 'WAV File'}
            <p class="priceopte">${beat.wavPrice}</p>
            <p class="priceTypeJoint">Digital Download</p>
        {:else if buttonType === 'Stems'}
            <p class="priceopte">${beat.stemsPrice}</p>
            <p class="priceTypeJoint">Digtial Download</p>
        {/if}

    </div>


</button>


<style>
    .priceOpButton {
        width: calc(100%);
        cursor: pointer;
        margin: 0px;
        border-radius: 6px;
        text-align: left;
        border: none;
        padding: 10px;
        overflow: hidden;
        border: 1px solid #363636;
        transition: .3s;
        position: relative;
        z-index: 0; /* Create a new stacking context */
        position: relative; /* Ensure stacking context applies */
        overflow: hidden; /* Prevents child elements from overflowing */
    }
    .priceOpButton:hover {
        background-color: #cacaca;
    }
    .beatPriceOpTitle {
        font-size: 13pt;
        padding: 0px;
        margin: 0px;
    }
    .priceopte {
        font-size: 12pt;
    }
    .priceTypeJoint {
        margin-top: 5px;
        font-size: 9pt;
    }
    .wrapinnerB {
        z-index: 1;
    }
    .buttonforCart {
        background-color: #222222;
        border-color: #222222;
    }
    .buttonforCart:hover {
        border-color: #151515;
        background-color: #151515;

    }
    .buttonforCart p{
        color: #eeeeee;
    }

</style>
