<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import CloseButton from "../buttons/CloseButton.svelte";
    import "./Modal.css";
    import { createEventDispatcher, onMount } from "svelte";
    import { audioPlayerState } from "../../stores/AudioPlayerStore";
    import { scrolledTwoFifty } from "../../stores/AudioStyleStore";
    import GlassSurface from "../UI/GlassSurface.svelte";

    export let modalTitle = "Enter modalTitle";
    export let modalWidth = "600px";

    const dispatch = createEventDispatcher();

    onMount(() => {
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    });

    function handleClose() {
        dispatch("closeModal");
    }

    function onWindowKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.preventDefault();
            handleClose();
        }
    }
</script>

<!-- <svelte:window on:keydown={onWindowKeydown} /> -->

<div
    class="modalWrap"
    in:fade={{ duration: 200 }}
    out:fade={{ delay: 200, duration: 200 }}
>
    <button
        class="modalBackdrop"
        type="button"
        aria-label="Close modal"
        tabindex="-1"
        on:click={handleClose}
    ></button>

    <div
        class="innerModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabindex="-1"
        in:fly={{ duration: 200, y: 500 }}
        style="width: {modalWidth}"
    >
        <div class="modalHeader">
            <h5 id="modal-title">{modalTitle}</h5>

            <CloseButton on:click={handleClose} color="f7f7f7" />
        </div>

        <div
            class="wrapTheSlot"
            class:padForTheAudio={$scrolledTwoFifty &&
                $audioPlayerState !== "Idle"}
        >
            <slot />
        </div>
    </div>
</div>
