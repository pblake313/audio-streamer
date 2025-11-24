<script lang="ts">
    import BoxButton from '../../buttons/BoxButton.svelte';
    import AudioVisualizer from '../../misc/AudioVisualizer.svelte';
    import FormInputErrorText from '../../errors/FormInputErrorText.svelte';
  import './Mp3Uploader.css';

  let fileInput: HTMLInputElement | null = null;

  export let mp3Url: string | null = null;
  export let fileName: string | null = null;

  // parent-owned error (e.g. "Missing" on form submit)
  export let inputError: string | null = null;

  export let label: string = `Enter 'label'`;
  export let maxFileSizeMB: number = 10;
  export let file: File | null = null;
  export let id: string | null = null;
  export let dropZoneClass: string = '';
  export let showInputError: boolean = true;

  // callback props
  export let mp3Uploaded:
    | ((payload: { mp3Url: string; file: File }) => void)
    | undefined;
  export let clearInput: (() => void) | undefined;

  // child-owned internal error (wrong type, too big, etc.)
  let internalError: string | null = null;

  // merged error shown in UI
  let combinedError: string | null = null;
  $: combinedError = internalError ?? inputError;

  // Unique id
  const genId = () =>
    `mp3-uploader-${
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }`;
  let inputId = id || genId();
  $: if (id && id !== inputId) inputId = id;

  const acceptedTypes = [
    'audio/mpeg', // most browsers
    'audio/mp3', // Safari / WebKit
    'audio/x-mpeg' // old crap
  ];

  let dragActive = false;
  let zoneEl: HTMLDivElement | null = null;

  function handleFiles(files: FileList | File[]) {
    const picked = Array.isArray(files) ? files[0] : files.item(0);
    if (!picked) return;

    internalError = null; // reset child error each attempt

    if (!acceptedTypes.includes(picked.type)) {
      internalError = 'Please upload an MP3 file.';
      setTimeout(() => {
        internalError = null;
      }, 3000);
      return;
    }

    const maxBytes = maxFileSizeMB * 1024 * 1024;
    if (picked.size > maxBytes) {
      internalError = `Max file size is ${maxFileSizeMB} MB. Selected file is ${(
        picked.size /
        (1024 * 1024)
      ).toFixed(1)} MB.`;

      if (fileInput) fileInput.value = '';
      if (mp3Url?.startsWith('blob:')) URL.revokeObjectURL(mp3Url);
      mp3Url = null;
      fileName = null;
      file = null;
      clearInput?.();
      return;
    }

    file = picked;
    fileName = picked.name;

    if (mp3Url?.startsWith('blob:')) URL.revokeObjectURL(mp3Url);
    mp3Url = URL.createObjectURL(picked);

    internalError = null;

    mp3Uploaded?.({ mp3Url, file });
  }

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) handleFiles(target.files);
  }

  function uploadFile() {
    fileInput?.click();
  }

  function resetInput(event?: Event) {
    event?.stopPropagation();
    if (fileInput) fileInput.value = '';
    if (mp3Url?.startsWith('blob:')) URL.revokeObjectURL(mp3Url);
    mp3Url = null;
    fileName = null;
    file = null;
    clearInput?.();
    internalError = null;
  }

  // DnD handlers
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
    const dt = e.dataTransfer;
    if (dt?.files?.length) handleFiles(dt.files);
  };

  const onZoneClick = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('.no-open, button, a, input, textarea, select')) return;
    uploadFile();
  };

  const onKeyOpen = (e: KeyboardEvent) => {
    if (e.currentTarget !== e.target) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      uploadFile();
    }
  };
</script>

<div class="flexImageLabel">
  <label class="imageUploadLabel" for={inputId}>
    <p>{label}</p>
  </label>
  <div><p class="maxLabelText">{maxFileSizeMB}MB</p></div>
</div>

<div
  bind:this={zoneEl}
  class={`dropZone ${dropZoneClass} ${dragActive ? 'dragActive' : ''}`}
  class:hasFileSelected={fileName}
  class:errorInput={combinedError && !fileName}
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
    <div class="hasSelectedFileFlex">
      <div class="containSelectedjoint">
        <p class="selectedImageFilename"><b>Selected:</b> {fileName}</p>
      </div>
      <div class="containRemovalButton">
        <BoxButton
          on:click={resetInput}
          tightPad={true}
          buttonIcon={'trash'}
          buttonText={''}
          fullWidth={true}
        />
      </div>
    </div>

    {#if mp3Url}
      {#key mp3Url}
        <div
          class="no-open mp3VisualizerWrap"
          role="button"
          tabindex="-1"
          on:click|stopPropagation
          on:mousedown|stopPropagation
          on:pointerdown|stopPropagation
          on:keydown|stopPropagation
          on:touchstart|stopPropagation
        >
          <AudioVisualizer showTime={false} height={30} audioUrl={mp3Url} />
        </div>
      {/key}
    {/if}
  {:else}
    <div class="imgUp-emptyState">
      <p class="imgUp-emptyTitle">
        <b><u>Click to upload</u></b> or drag and drop
      </p>
      <p class="imgUp-fileTypes">Accepted: MP3</p>
    </div>
  {/if}
</div>

<input
  id={inputId}
  type="file"
  bind:this={fileInput}
  accept=".mp3,audio/mpeg,audio/mp3,audio/x-mpeg"
  on:change={handleFileChange}
  style="display:none"
/>

{#if showInputError && combinedError}
  <FormInputErrorText inputErrorText={combinedError} />
{/if}
