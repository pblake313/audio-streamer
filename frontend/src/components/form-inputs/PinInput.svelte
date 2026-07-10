<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let pin: string[] = Array(6).fill('');
    let inputs: HTMLInputElement[] = [];

    function handleInput(event: Event, index: number) {
        const inputEvent = event as InputEvent;
        const target = inputEvent.target as HTMLInputElement;

        // 🔒 only allow digits 0-9
        const value = target.value.replace(/[^0-9]/g, '').charAt(0);
        if (!value) {
            target.value = '';
            return;
        }

        pin[index] = value;
        target.value = value;

        if (index < inputs.length - 1) {
            inputs[index + 1].focus();
        }

        const joinedPin = pin.join('');
        dispatch('change', joinedPin);

        if (joinedPin.length === 6 && pin.every((p) => p)) {
            dispatch('pinSubmitted', joinedPin);
            setTimeout(() => {
                clearPin();
            }, 100);
        }
    }

    function handleKeyDown(event: KeyboardEvent, index: number) {
        const target = event.target as HTMLInputElement;

        if (event.key === 'Backspace') {
            if (pin[index]) {
                pin[index] = '';
                target.value = '';
            } else if (index > 0) {
                inputs[index - 1].focus();
                pin[index - 1] = '';
                inputs[index - 1].value = '';
            }

            dispatch('change', pin.join(''));
        }
    }

    onMount(() => {
        inputs[0]?.focus();
    });

    export function clearPin() {
        pin = Array(6).fill('');
        inputs.forEach((input) => {
            if (input) input.value = '';
        });
        inputs[0]?.focus();
        dispatch('change', '');
    }

    export function getPin() {
        return pin.join('');
    }
</script>

<div class="pin-input-wrapper">
    {#each Array(6) as _, i}
        <input
            type="password"
            bind:this={inputs[i]}
            maxlength="1"
            on:input={(e) => handleInput(e, i)}
            on:keydown={(e) => handleKeyDown(e, i)}
            class="pin-box"
            inputmode="numeric"
            autocomplete="one-time-code"
        />
    {/each}
</div>
<style>
    .pin-input-wrapper {
        box-sizing: border-box;
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 0.75rem;
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
        padding: 4px 0;
        overflow: visible;
    }

    .pin-box {
        appearance: none;
        -webkit-appearance: none;

        box-sizing: border-box;
        display: block;

        aspect-ratio: 1 / 1;
        width: 100%;
        min-width: 0;

        padding: 0;
        margin: 0;

        border: 1px solid rgba(255, 255, 255, 0.32);
        border-radius: 14px;

        background: transparent;

        color: #fff;
        text-align: center;
        font-family: inherit;
        font-size: clamp(1.2rem, 4vw, 1.8rem);
        font-weight: 600;
        line-height: 1;
        letter-spacing: 0.04em;

        outline: none;
        caret-color: transparent;

        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);

        transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
    }

    .pin-box:hover {
        border-color: rgba(255, 255, 255, 0.5);
    }

    .pin-box:focus {
        border-color: rgba(255, 255, 255, 0.95);

        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            inset 0 0 14px rgba(255, 255, 255, 0.08);
    }

    .pin-box::selection {
        background: transparent;
    }

    @media (max-width: 600px) {
        .pin-input-wrapper {
            gap: 0.45rem;
            padding: 3px 0;
        }

        .pin-box {
            border-radius: 10px;
            font-size: 1.25rem;
        }
    }

    @media (max-width: 360px) {
        .pin-input-wrapper {
            gap: 0.35rem;
        }

        .pin-box {
            border-radius: 8px;
            font-size: 1.1rem;
        }
    }
</style>