<script lang="ts">
    import { fade } from "svelte/transition";
    import PinInput from "../components/form-inputs/PinInput.svelte";
    import FormError from "../components/reusable/FormError.svelte";
    import SpinLoader from "../components/reusable/Loaders/SpinLoader.svelte";
    import Logo from "../components/svg/Logos/Logo.svelte";
    import { publicFetch } from "../helpers/Fetchers/publicFetch";
    import './PinForm.css'
    import { accessToken } from "../stores/tokenStore";
    import { goto } from "$app/navigation";
    import { autoLogin, getAuthenticatedUser } from "../helpers/Auth/authFunctions";
    import { onMount } from "svelte";
    import { user } from "../stores/UserStore";

    let formErrorMessage: string | null = null;
    let isLoading: boolean = false;

    // track the timeout so we can reset it
    let pinErrorTimeout: ReturnType<typeof setTimeout> | null = null;


    onMount(()=> {
        if ($user === true){
            goto('/portal')
        }
    })

    async function pinSubmitted(event: CustomEvent) {
        try {
            isLoading = true;
            formErrorMessage = null;

            const pin = event.detail;

            const response = await publicFetch('/auth/login-with-pin', {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({ pin })
            });

            console.log(response);

            if (response.accessToken) {
                accessToken.set(response.accessToken);

                // call autologin...

                await getAuthenticatedUser()
                goto('/portal')

            } else {
                formErrorMessage = 'A successful response occurred, but no access token was received.';
                resetPinError(5);
            }

        } catch (error: any) {
            formErrorMessage = error.message || 'An unknown error has occurred.';
            resetPinError(5);
        } finally {
            isLoading = false;
        }
    }

    function resetPinError(seconds: number) {
        // clear any existing timer so it fully resets
        if (pinErrorTimeout) {
            clearTimeout(pinErrorTimeout);
        }

        pinErrorTimeout = setTimeout(() => {
            formErrorMessage = null;
            pinErrorTimeout = null; // optional, but keeps it clean
        }, seconds * 1000);
    }
</script>


<div class="wrapPINForm">

    <div class="wraplogopin">
        <Logo color={'#f7f7f7'} width={'100%'}></Logo>
    </div>

    <p style="text-align: center; opacity: .6; font-size: 9pt; margin-top: 15px; margin-right: 5px;">Enter PIN Below</p>



    <div class="holdPIN">
        {#if !isLoading}
            <PinInput on:pinSubmitted={pinSubmitted}></PinInput>
        {:else}
            <SpinLoader></SpinLoader>
        {/if}
    </div>
    {#if formErrorMessage}
        <div class="wrapPinErrorMessage" in:fade={{duration: 350}} out:fade={{duration: 300}}>
            <FormError textAlign={'center'} errorMessage={formErrorMessage} errorTitle={'PIN Error'}></FormError>
        </div>
    {/if}
</div>
