<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import BoxButton from "./BoxButton.svelte";
  import MinusIcon from "../svg/Icons/MinusIcon.svelte";
  import AddIcon from "../svg/Icons/AddIcon.svelte";

    export let disableAdd: boolean = false;
    export let quantity: number = 0;

    const dispatch = createEventDispatcher();

    function addClicked() {
        dispatch('addClicked');
    }
    function minusClicked(){
        dispatch('minusClicked')
    }
</script>

<div class="cartQFlex">

    <button  on:click={minusClicked} class="cartqb">
        <div class="qicrap minner">
            <MinusIcon color={'222222'} height={'15px'}></MinusIcon>
        </div>
    </button>


    <div class="quanout">
        <p style="font-size: 10pt;">{quantity}</p>
    </div>

    <button disabled={disableAdd} on:click={addClicked} class="cartqb">
        <div class="qicrap addda">
            <AddIcon color={'222222'} height={'15px'}></AddIcon>
        </div>
    </button>

</div>

<style>
    .cartQFlex{
        display: flex;
        align-items: center;

    }
    .quanout {
        width: 30px;
        margin: 0px 5px;
        user-select: none;
        text-align: center;
        padding-top: 3px;
    }
    .cartqb {
        border: none;
        padding: 0px;
        margin: 0px;
        width: 20px;
        height: 20px;
        border-radius: 2px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        background-color: transparent;
    }
    .qicrap {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .minner {
        padding-top: 4px;
    }
    .addda{
        padding-top: 3px;
    }
    .cartqb:disabled {
        opacity: .25;
    }
</style>