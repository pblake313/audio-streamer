<script lang="ts">
    import FormInputErrorText from './FormInputErrorText.svelte';
    import './BpmInput.css'

    export let id: string | null = `${Date.now()}-${Math.random()}`;
    export let showInputErrors: boolean = true;
    export let inputError: string | null = null;

    // numeric source of truth
    export let bpm: number = 0;

    // Svelte 5-style callback prop
    export let bpmChanged: ((value: number) => void) | undefined;

    let inputEl: HTMLInputElement | null = null;

    function clamp(n: number) { return Math.min(Math.max(n, 0), 199); }
    function sanitizeDigits(s: string) {
        return s.replace(/\D/g, '').slice(0, 3); // digits only, max 3 chars
    }

    function emit(val: number) {
        bpmChanged?.(val);
    }

    function handleInput(event: Event) {
        const el = event.target as HTMLInputElement;
        const digitsOnly = sanitizeDigits(el.value);
        const numericValue = clamp(parseInt(digitsOnly || '0', 10));

        if (numericValue !== bpm) {
            bpm = numericValue;   // bind:value updates DOM
            emit(bpm);
        } else if (el.value !== String(numericValue)) {
            // normalize visual if needed (leading zeros/junk)
            el.value = String(numericValue);
        }
    }

    // no highlight; caret at start when value is 0
    function handleFocus() {
        if (!inputEl) return;
        if (bpm === 0) {
            queueMicrotask(() => inputEl && inputEl.setSelectionRange(0, 0));
        }
    }

    // replace the lone "0" with the first typed digit, without selecting it
    function handleBeforeInput(e: InputEvent) {
        if (!inputEl) return;
        if (bpm !== 0) return;                         // only special-case when it's 0
        if (inputEl.value !== '0') return;             // and the field literally shows "0"
        if (e.inputType !== 'insertText') return;      // typing (not delete/paste/etc)
        const data = e.data ?? '';
        if (!/^\d$/.test(data)) return;                // only digits

        e.preventDefault();                            // stop the default insert
        const num = clamp(parseInt(data, 10));
        bpm = num;
        inputEl.value = String(num);
        emit(num);
        queueMicrotask(() => inputEl && inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length));
    }

    // paste should also replace the 0 cleanly
    function handlePaste(e: ClipboardEvent) {
        if (!inputEl) return;
        if (bpm === 0 && inputEl.value === '0') {
            e.preventDefault();
            const pasted = e.clipboardData?.getData('text') ?? '';
            const digits = sanitizeDigits(pasted);
            const num = clamp(parseInt(digits || '0', 10));
            bpm = num;
            inputEl.value = String(num);
            emit(num);
            queueMicrotask(() => inputEl && inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length));
        }
    }
</script>

<div class="bpmInputContainer" class:bpmInputError={inputError}>
    <label class="bpmInputLabel" for={id}>
        <p>BPM</p>
    </label>
    <input
        {id}
        class="bpmInput"
        class:grayoutBpm={bpm === 0}
        type="text"
        inputmode="numeric"
        pattern="\d*"
        maxlength="3"
        bind:this={inputEl}
        bind:value={bpm}
        on:focus={handleFocus}
        on:beforeinput={handleBeforeInput}
        on:paste={handlePaste}
        on:input={handleInput}
        autocomplete="off"
    />
</div>

{#if showInputErrors}
    <FormInputErrorText inputErrorText={inputError} />
{/if}