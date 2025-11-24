<script lang="ts">
    import { fade } from "svelte/transition";
    import PinInput from "../components/form-inputs/PinInput.svelte";
    import FormError from "../components/errors/FormError.svelte";
    import Logo from "../components/svg/Logos/Logo.svelte";
    import { publicFetch } from "../helpers/Fetchers/publicFetch";
    import './PinForm.css'
    import { accessToken, streamToken } from "../stores/tokenStore";
    import { goto } from "$app/navigation";
    import { getAuthenticatedUser } from "../helpers/Auth/authFunctions";
    import { onMount } from "svelte";
    import { user } from "../stores/UserStore";
    import { checkIp, checkIpErrorMesssage, isCheckingIp, userBlockedMessage } from "../stores/IPStore";
    import AudioLoader from "../components/loaders/AudioLoader.svelte";

    let formErrorMessage: string | null = null;
    let isLoading: boolean = false;

    // track the timeout so we can reset it
    let pinErrorTimeout: ReturnType<typeof setTimeout> | null = null;


    onMount(async ()=> {
        if ($user === true){
            goto('/portal')
        }
        await checkIp()
        
    })

    async function pinSubmitted(event: CustomEvent) {
        try {

            if ($userBlockedMessage) return

            isLoading = true;
            formErrorMessage = null;

            const pin = event.detail;

            const response = await publicFetch('/auth/login-with-pin', {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({ pin })
            });

            if (response.streamToken){
                streamToken.set(response.streamToken)
            }

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

            if (error?.data?.blocked) {

                if (error?.data?.blockedUntil) {

                    const readableDate = new Date(error.data.blockedUntil)
                        .toLocaleString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit"
                        });

                    userBlockedMessage.set(
                        `You have been denied access until ${readableDate}. You may try again after that.`
                    );

                } else {
                    userBlockedMessage.set('Access denied.');
                }

                return;
            }

            // set the error message
            const errorMessage = error.message || "An unknown error has occurred.";
            const attemptsRemaining: number | undefined = error?.data?.attemptsRemaining;
            let combinedError = errorMessage;
            if (typeof attemptsRemaining === "number") {
                combinedError += ` | ${attemptsRemaining} attempt${
                    attemptsRemaining === 1 ? "" : "s"
                } remaining`;
            }



            formErrorMessage = combinedError;
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


    {#if !$isCheckingIp}


        {#if $checkIpErrorMesssage}
            <div class="pinError" in:fade={{duration: 300}}>
                <br>
                <p>{$checkIpErrorMesssage}</p>
            </div>
        {:else}


            {#if !$userBlockedMessage}
                <p style="text-align: center; opacity: .6; font-size: 9pt; margin-top: 15px; margin-right: 5px;">Enter PIN Below</p>
            {/if}


            <div class="holdPIN">
                {#if !isLoading}

                    {#if !$userBlockedMessage}
                        <PinInput on:pinSubmitted={pinSubmitted}></PinInput>


                    {:else}
                        <div class="pinError">
                            <p>{$userBlockedMessage || 'Unauthorized'}</p>
                        </div>

                    {/if}

                {:else}
                        <div style="margin: auto; max-width: 150px; width: 100%" in:fade={{duration: 300}}>
                            <AudioLoader backgroundColor={'#222222'}></AudioLoader>
                        </div>
                        
                {/if}
            </div>
            {#if formErrorMessage}
                <div class="wrapPinErrorMessage" in:fade={{duration: 350}} out:fade={{duration: 300}}>
                    <FormError textAlign={'center'} errorMessage={formErrorMessage} errorTitle={'PIN Error'}></FormError>
                </div>
            {/if}



            
        {/if}

   

    {:else}
        <div class="wrapIpChecker" in:fade={{duration: 300}}>
            <p style="opacity: .5; font-size: 9pt;">Hang tight. Validating.</p>
            <br>
            <AudioLoader backgroundColor={'#222222'}></AudioLoader>
        </div>

    {/if}

    

</div>
