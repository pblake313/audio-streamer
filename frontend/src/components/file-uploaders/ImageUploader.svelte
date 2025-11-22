<script lang="ts">
  import BoxButton from '../buttons/BoxButton.svelte';
  import FormInputErrorText from '../form-inputs/FormInputErrorText.svelte';
  import './ImageUploader.css';

  // props from parent
  export let imageUrl: string | null = null;
  export let fileName: string | null = null;
  export let inputError: string | null = null; // parent-owned (e.g. "Please upload an artwork image.")
  export let label: string = `Enter 'label'`;
  export let showInputError: boolean = true;
  export let maxFileSizeMB: number = 5;
  export let id: string | null = null;

  export let fileUploaded:
    | ((payload: { imageUrl: string; file: File }) => void)
    | undefined;
  export let clearInput: (() => void) | undefined;

  let fileInput: HTMLInputElement | null = null;
  export let dropZoneClass: string = '';

  // child-owned error for type/size/etc
  let internalError: string | null = null;

  // combined error actually shown in UI
  let combinedError: string | null = null;
  $: combinedError = internalError ?? inputError;

  const genId = () =>
    `image-uploader-${
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }`;

  let inputId = id || genId();
  $: if (id && id !== inputId) inputId = id;

  const acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  let dragActive = false;
  let zoneEl: HTMLDivElement | null = null;

  function revokeBlob() {
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
  }

  function handleFiles(files: FileList | File[]) {
    const file = Array.isArray(files) ? files[0] : files.item(0);
    if (!file) return;

    // reset internal error on every attempt
    internalError = null;

    if (!acceptedTypes.includes(file.type)) {
      internalError = 'Please upload a JPEG, PNG, WEBP, or JPG file.';
      setTimeout(() => {
        internalError = null;
      }, 3000);
      return;
    }

    const maxBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      internalError = `Max file size is ${maxFileSizeMB} MB. Selected file is ${(
        file.size /
        (1024 * 1024)
      ).toFixed(1)} MB.`;

      if (fileInput) fileInput.value = '';
      revokeBlob();
      imageUrl = null;
      fileName = null;
      clearInput?.();
      return;
    }

    fileName = file.name;
    revokeBlob();
    imageUrl = URL.createObjectURL(file);

    internalError = null;

    fileUploaded?.({ imageUrl, file });
  }

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) handleFiles(target.files);
  };

  const resetInput = () => {
    if (fileInput) fileInput.value = '';
    revokeBlob();
    imageUrl = null;
    fileName = null;
    clearInput?.();
    internalError = null;
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    dragActive = true;
  };
  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragActive = true;
  };
  const onDragLeave = (e: DragEvent) => {
    if (e.currentTarget === e.target) dragActive = false;
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    dragActive = false;
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };

  const openPicker = () => fileInput?.click();

  const onZoneClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('.imgUp-noOpen, button, a, input, textarea, select')) return;
    openPicker();
  };

  const onKeyOpen = (e: KeyboardEvent) => {
    if (e.currentTarget !== e.target) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };
</script>

<div class="imgUp-labelRow">
  <label class="imgUp-label" for={inputId}>{label}</label>
  <p class="imgUp-maxSize">{maxFileSizeMB}MB</p>
</div>

<div
  bind:this={zoneEl}
  class={`imgUp-dropZone ${dropZoneClass} ${dragActive ? 'imgUp-dragActive' : ''}`}
  class:imgUp-hasFile={fileName}
  class:imgUp-error={combinedError && !fileName}
  role="button"
  tabindex="0"
  aria-controls={inputId}
  on:click={onZoneClick}
  on:keydown={onKeyOpen}
  on:dragover={onDragOver}
  on:dragenter={onDragEnter}
  on:dragleave={onDragLeave}
  on:drop={onDrop}
>
  {#if fileName}
    <div class="imgUp-selectedRow">
      <div class="imgUp-selectedName">
        <p class="imgUp-fileName"><b>Selected:</b> {fileName}</p>
      </div>
      <div class="imgUp-removeBtn">
        <BoxButton
          on:click={resetInput}
          tightPad={true}
          fullWidth={true}
          buttonIcon={'trash'}
          buttonText={''}
        />
      </div>
    </div>
  {:else}
    <div class="imgUp-emptyState">
      <p class="imgUp-emptyTitle">
        <b><u>Click to upload</u></b> or drag and drop
      </p>
      <p class="imgUp-fileTypes">Accepted: JPEG / PNG / WEBP / JPG</p>
    </div>
  {/if}
</div>

<input
  id={inputId}
  type="file"
  bind:this={fileInput}
  accept="image/jpeg, image/png, image/jpg, image/webp"
  on:change={handleFileChange}
  style="display:none"
/>

{#if showInputError && combinedError}
  <FormInputErrorText inputErrorText={combinedError} />
{/if}
