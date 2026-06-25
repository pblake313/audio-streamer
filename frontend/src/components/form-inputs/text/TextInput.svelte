<script lang="ts">
    import FormInputErrorText from "../../errors/FormInputErrorText.svelte";
    import "./TextInput.css";

    export let label: string;
    export let value: string | null = null;
    export let id: string | null = `${Date.now() + Math.random()}`;
    export let placeholder: string | null = null;
    export let inputError: string | null = null;
    export let maxlength: number = 200;
    export let showInputErrors: boolean = true;
    export let showLimit = true;

    export let onTextChange: ((val: string | null) => void) | undefined;

    $: inputValue = value ?? "";
    $: characterCount = value?.length ?? 0;

    function handleTextInput(event: Event) {
        const input = event.target as HTMLInputElement;

        // Empty input becomes null
        const newValue = input.value.trim() === "" ? null : input.value;

        onTextChange?.(newValue);
    }
</script>

<div class="textInputContainer" class:error={!!inputError}>
    <label class="textLabel" for={id}>
        <p>{label}</p>

        {#if showLimit}
            <p class="charval">{characterCount} / {maxlength}</p>
        {/if}
    </label>

    <input
        class="textInput"
        {id}
        type="text"
        value={inputValue}
        on:input={handleTextInput}
        placeholder={placeholder ?? label}
        autocomplete="off"
        {maxlength}
    />
</div>

{#if showInputErrors}
    <FormInputErrorText inputErrorText={inputError} />
{/if}