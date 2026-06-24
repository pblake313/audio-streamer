<script lang="ts">
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";
    import AudioStreamer from "../../components/standalone/AudioStreamer.svelte";
    import Nav from "../../components/standalone/Nav/Nav.svelte";
    import { user } from "../../stores/UserStore";
    import { autoLoginAttempted } from "../../helpers/Auth/authFunctions";

    // Only run this on the client
    $: if (!$user) {
        goto('/')
    }
</script>


{#if $user && $autoLoginAttempted}
    <Nav />

    <slot />

    <AudioStreamer />

{/if}
