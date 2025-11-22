<script lang="ts">
  import SpinLoader from "../../reusable/Loaders/SpinLoader.svelte";
import AddIcon from "../../svg/Icons/AddIcon.svelte";
  import CartIcon from "../../svg/Icons/CartIcon.svelte";
  import PauseIcon from "../../svg/Icons/PauseIcon.svelte";
import PlayIcon from "../../svg/Icons/PlayIcon.svelte";
import ShareIcon from "../../svg/Icons/ShareIcon.svelte";

    export let buttonText: string | null = 'Enter Button Text'
    export let buttonIcon : 'Share' | 'Play' | 'Add' | 'Cart' | 'Pause' | 'Loading' | null = null
    export let showBorder: boolean = true
</script>

<button class="moropButtonWrap" class:addBottomBord={showBorder} on:click>
    <div class="opText">
        <p class="bte">{buttonText}</p>

    </div>

    <div class="opIc">
        <div class="wrapeye">

            {#if buttonIcon === 'Share'}
                <div style="margin-top: 3px;">
                    <ShareIcon height={'15px'}></ShareIcon>
                </div>
            {/if}
            {#if buttonIcon === 'Play'}
                <PlayIcon height={'12px'}></PlayIcon>
            {/if}
            {#if buttonIcon === 'Pause'}
                <PauseIcon height={'12px'}></PauseIcon>
            {/if}
            {#if buttonIcon === 'Add'}
                <div style="margin-top: 3px;">
                    <AddIcon height={'14px'}></AddIcon>
                </div>
            {/if}

            {#if buttonIcon === 'Cart'}
                <div style="margin-top: 3px;">
                    <CartIcon height={'16px'}></CartIcon>
                </div>
            {/if}
            {#if buttonIcon === 'Loading'}
                <SpinLoader></SpinLoader>
            {/if}

        </div>
    </div>
</button>

<style> 
    button {
        -webkit-tap-highlight-color: transparent; /* Removes highlight on mobile */
    }
    .moropButtonWrap {
        display: flex;
        padding: 0px;
        margin: 0px;
        width: 100%;
        justify-content: space-between;
        align-items: center;
        padding: 10px 10px 10px 15px;
        cursor: pointer;
        border: none;
    }
    .moropButtonWrap:hover {
        background-color: #e3e3e3;
    }
    .addBottomBord {
        border-bottom: 1px solid lightgray;
    }
    .opText {
        overflow: hidden;
        width: calc(100% - 35px);
        overflow: hidden;
        text-align: left;
    }
    .opIc {
        width: 25px;
        height: 25px;
        position: relative;
    }
    .wrapeye{
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .bte {
        white-space: nowrap;
        text-overflow: ellipsis;
        width: 100%;
        font-size: 11pt;
    }
</style>