<script lang="ts">
  import { onMount, tick } from 'svelte';
  import FormInputErrorText from './FormInputErrorText.svelte';
  import './TextArea.css';

  export let label = 'Enter Label Value';
  export let value = '';
  export let id: string | null = `${Date.now() + Math.random()}`;
  export let placeholder: string | null = null;
  export let inputError = '';
  export let showInputError = true;
  export let maxCharachters = 750;
  export let valueChanged: ((val: string) => void) | undefined;

  let textareaEl: HTMLTextAreaElement;
  let measuring = false;

  async function setHeight() {
    if (measuring) return;          // prevent layout thrash
    measuring = true;

    // wait for DOM to render any new text before measuring
    await tick();
    textareaEl.style.height = 'auto';
    textareaEl.style.height = textareaEl.scrollHeight + 'px';

    measuring = false;
  }

  onMount(async () => {
    // wait one paint frame so baseline is settled
    await tick();
    setHeight();
  });

  function autoResize(event: Event) {
    valueChanged?.((event.target as HTMLTextAreaElement).value);
    setHeight();
  }
</script>

<div class="textAreaContainer" class:error={inputError}>
  <label class="textAreaLabel" for={id}>{label}</label>
  <textarea
    bind:this={textareaEl}
    class="actualTextArea"
    id={id}
    rows="1"
    bind:value={value}
    on:input={autoResize}
    placeholder={placeholder || label}
    autocomplete="off"
    maxlength={maxCharachters}
    style="overflow:hidden; resize:none;"
  ></textarea>

  <div class="remainingCharachters">
    <p class="remainText">{value.length} / {maxCharachters}</p>
  </div>
</div>

{#if inputError && showInputError}
  <FormInputErrorText inputErrorText={inputError} />
{/if}
