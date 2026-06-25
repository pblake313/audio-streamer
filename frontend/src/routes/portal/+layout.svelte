<script lang="ts">
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";

    import AudioStreamer from "../../components/standalone/AudioStreamer.svelte";
    import Nav from "../../components/standalone/Nav/Nav.svelte";
    import Loader from "../../components/loaders/Loader.svelte";

    import { user } from "../../stores/UserStore";
    import { autoLoginAttempted } from "../../helpers/Auth/authFunctions";

    let redirected = false;

    $: if (browser && $autoLoginAttempted && !$user && !redirected) {
        redirected = true;
        goto("/login", {
            replaceState: true,
        });
    }
</script>

{#if !$autoLoginAttempted}
    <Loader loaderStyle="loader_full" />
{:else if $user}
    <Nav />
    <slot />
    <AudioStreamer />
{/if}