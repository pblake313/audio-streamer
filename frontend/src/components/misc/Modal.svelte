<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import CloseButton from '../buttons/CloseButton.svelte';
  import './Modal.css';
  import { createEventDispatcher, onMount } from 'svelte';
  import { audioPlayerState } from '../../stores/AudioPlayerStore';
  import { scrolledTwoFifty } from '../../stores/AudioStyleStore';

  export let modalTitle = 'Enter modalTitle';
  export let modalWidth = '600px';

  const dispatch = createEventDispatcher();

  onMount(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  });

  const handleClose = () => dispatch('closeModal');

  // Close with ESC only (no Enter/Space BS)
  function onWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={onWindowKeydown} />

<!-- BACKDROP -->
<div
  class="modalWrap"
  role="button"
  tabindex="0"
  on:click={handleClose}
  in:fade={{ duration: 200 }}
  out:fade={{ delay: 200, duration: 200 }}
>
  <!-- DIALOG -->
  <div
    class="innerModal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
    on:click|stopPropagation
    in:fly={{ duration: 200, y: 500 }}
    style="width: {modalWidth}"
  >
    <div class="modalHeader">
      <h5 id="modal-title">{modalTitle}</h5>
      <!-- Make sure this button is type="button" inside CloseButton.svelte -->
      <CloseButton on:click={handleClose} color={"f7f7f7"} />
    </div>

    <div
      class="wrapTheSlot"
      class:padForTheAudio={$scrolledTwoFifty && $audioPlayerState !== 'Idle'}
    >
      <slot />
    </div>
  </div>
</div>
