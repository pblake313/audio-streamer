<script lang="ts">
    import FormInputErrorText from "../../errors/FormInputErrorText.svelte";
    import "./TextInput.css";

    export let label: string = "Enter 'label'";
    export let value: string = "";
    export let id: string | null = `${Date.now() + Math.random()}`;
    export let placeholder: string | null = null;
    export let inputError: string | null = null;
    export let maxlength: number = 200;
    export let showInputErrors: boolean = true;
    export let showLimit = true;

    // ✅ new way: callback prop instead of createEventDispatcher
    export let onTextChange: ((val: string) => void) | undefined;

    function handleTextInput(event: Event) {
        const input = event.target as HTMLInputElement;
        onTextChange?.(input.value); // directly call the callback if provided
    }
</script>

<div class="textInputContainer" class:error={!!inputError}>
    <label class="textLabel" for={id}>
        <p>{label}</p>

        {#if showLimit}
            <p class="charval">{value.length || 0} / {maxlength}</p>
        {/if}
    </label>
    <input
        class="textInput"
        {id}
        type="text"
        {value}
        on:input={handleTextInput}
        placeholder={placeholder ?? label}
        autocomplete="off"
        {maxlength}
    />
</div>

{#if showInputErrors}
    <FormInputErrorText inputErrorText={inputError}></FormInputErrorText>
{/if}
