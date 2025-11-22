<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
  
    const dispatch = createEventDispatcher();
  
    let pin: string[] = Array(6).fill('');
    let inputs: HTMLInputElement[] = [];
  
    function handleInput(event: Event, index: number) {
      const inputEvent = event as InputEvent;
      const target = inputEvent.target as HTMLInputElement;
      const value = target.value.replace(/[^0-9a-zA-Z]/g, '').charAt(0); // sanitize to 1 char
      if (!value) return;
  
      pin[index] = value;
  
      if (index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
  
      const joinedPin = pin.join('');
      dispatch('change', joinedPin);
  
      if (joinedPin.length === 6 && pin.every(p => p)) {
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
        } else if (index > 0) {
          inputs[index - 1].focus();
          pin[index - 1] = '';
        }
  
        dispatch('change', pin.join(''));
      } 
    }
  
    onMount(() => {
      inputs[0]?.focus();
    });
  
    export function clearPin() {
      pin = Array(6).fill('');
      inputs.forEach(input => {
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
            display: flex;
            gap: 0.7rem;
        }
    
        .pin-box {
            width: 3rem;
            height: 3rem;
            font-size: 1.5rem;
            background-color: transparent;
            text-align: center;
            border: 1px solid #404040;
            border-radius: 0.375rem;
            outline: none;
            transition: border-color 0.2s;
            color: #c0c0c0;
        }
    
        .pin-box:focus {
            border-color: white;
            box-shadow: 0px 0px 5px rgba(255, 255, 255, 0.336);
        }

        @media (max-width: 600px){
            .pin-box {
                width: 2rem;
                height: 2rem;
                border: 1px solid #404040;

            }
        }
  </style>
  