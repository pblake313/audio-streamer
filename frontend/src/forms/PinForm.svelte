<script lang="ts">
    import { tick } from "svelte";
    import PinInput from "../components/form-inputs/PinInput.svelte";
    import FormError from "../components/errors/FormError.svelte";
    import { publicFetch } from "../helpers/Fetchers/publicFetch";
    import "./PinForm.css";
    import { goto } from "$app/navigation";
    import { onMount, onDestroy } from "svelte";
    import { user } from "../stores/UserStore";
    import Loader from "../components/loaders/Loader.svelte";
    import { firestoreTimestampToDate, formatTimeRemaining } from "../helpers/formatters";
    import { accessToken } from "../stores/tokenStore";

    let isLoading: boolean = false;
    let pinErrorMessage: string | null = null;
    let pinErrorVisible: boolean = false;

    let errorTimeout: ReturnType<typeof setTimeout> | null = null;
    let removeErrorTimeout: ReturnType<typeof setTimeout> | null = null;

    function clearErrorTimeouts() {
        if (errorTimeout) {
            clearTimeout(errorTimeout);
            errorTimeout = null;
        }

        if (removeErrorTimeout) {
            clearTimeout(removeErrorTimeout);
            removeErrorTimeout = null;
        }
    }

    async function showPinError(message: string) {
        clearErrorTimeouts();

        pinErrorVisible = false;
        pinErrorMessage = message;

        await tick();

        pinErrorVisible = true;

        errorTimeout = setTimeout(() => {
            pinErrorVisible = false;

            removeErrorTimeout = setTimeout(() => {
                pinErrorMessage = null;
                removeErrorTimeout = null;
            }, 300);

            errorTimeout = null;
        }, 6000);
    }

    function clearPinErrorNow() {
        clearErrorTimeouts();
        pinErrorVisible = false;
        pinErrorMessage = null;
    }

    onMount(async () => {
        if ($user === true) {
            goto("/portal");
        }
    });

    onDestroy(() => {
        clearErrorTimeouts();
    });

    async function pinSubmitted(event: CustomEvent<string>) {
        const pin = event.detail;

        try {
            if (isLoading) return;

            clearPinErrorNow();
            isLoading = true;

            const response = await publicFetch("/auth/login-with-pin", {
                method: "POST",
                body: JSON.stringify({ pin }),
            });

            if (response?.accessToken){
                accessToken.set(response.accessToken )
                user.set(true)
            }

        } catch (error: any) {

            let errorMessage = error.message || 'An unknown error has occurred.'

            // console.log(error);
            const wrongPinDoc = error.data.wrongPinDoc || null

            if (wrongPinDoc) {
                const attemptsRemaining = Math.max(0, 5 - wrongPinDoc.attempts);

                errorMessage = `Invalid PIN: ${attemptsRemaining} attempts remaining.`;
            }

            // blocked error message
            if (wrongPinDoc?.blocked) {
                const lastAttempt = firestoreTimestampToDate(wrongPinDoc.lastAttempt);

                if (!lastAttempt) {
                    errorMessage = "This device is blocked. Please try again later.";
                    await showPinError(errorMessage);
                    return;
                }

                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                const blockedUntil = new Date(lastAttempt.getTime() + sevenDaysMs);

                const now = new Date();
                const timeRemainingMs = blockedUntil.getTime() - now.getTime();

                const timeRemaining = formatTimeRemaining(timeRemainingMs);

                errorMessage = `Too many invalid PIN attempts. This device is blocked for ${timeRemaining}.`;
            }


            await showPinError(errorMessage);

        } finally {
            isLoading = false;
        }
    }
</script>

<div class="wrapPINForm">
    <div class="holdPIN">
        <div class:pinInputWrap_closed={isLoading} class="pinInputWrap">
            <PinInput on:pinSubmitted={pinSubmitted} />
        </div>

        <div
            class:pinLoaderWrap_open={isLoading}
            class="pinLoaderWrap"
            aria-hidden={!isLoading}
        >
            <Loader />
        </div>

        <div
            class:pinErrorWrap_open={!isLoading && pinErrorVisible}
            class="pinErrorWrap"
            aria-live="polite"
        >
            {#if pinErrorMessage}
                <div class="pinError">
                    <FormError
                        errorMessage={pinErrorMessage}
                        errorTitle={"Login Error"}
                        textAlign={"center"}
                        color={'#f7f7f7'}
                    />
                </div>
            {/if}
        </div>

        <div
            class:pinHelpWrap_open={!isLoading && !pinErrorMessage}
            class="pinHelpWrap"
            aria-hidden={isLoading || !!pinErrorMessage}
        >
            <a href="/" class="pinForm_idk">Where is my code?</a>
        </div>
    </div>
</div>