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

    function hidePinError() {
        clearErrorTimeouts();
        pinErrorVisible = false;

        removeErrorTimeout = setTimeout(() => {
            pinErrorMessage = null;
            removeErrorTimeout = null;
        }, 300);
    }

    onMount(async () => {
        if ($user === true) {
            goto("/portal");
        }
    });

    onDestroy(() => {
        clearErrorTimeouts();
    });
    function clearPinErrorNow() {
        clearErrorTimeouts();
        pinErrorVisible = false;
        pinErrorMessage = null;
    }
    async function pinSubmitted(event: CustomEvent) {
        const pin = event.detail;

        try {
            if (isLoading) return;

            clearPinErrorNow();
            isLoading = true;

            const response = await publicFetch("/auth/login-with-pin", {
                method: "POST",
                body: JSON.stringify({ pin }),
            });

            console.log(response);

            if (response?.accessToken) {
                goto("/portal");
            }
        } catch (error: any) {
            console.log(error);
            await showPinError(
                error.message || "An unknown error has occurred.",
            );
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
                    />
                </div>
            {/if}
        </div>
    </div>
</div>
