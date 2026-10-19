<script lang="ts">
    import { goto } from "$app/navigation";
    import { browser } from "$app/environment";
    import { page } from "$app/stores";

    import AudioStreamer from "../../components/standalone/AudioStreamer.svelte";
    import Nav from "../../components/standalone/Nav/Nav.svelte";
    import Loader from "../../components/loaders/Loader.svelte";

    import { user } from "../../stores/UserStore";
    import { autoLoginAttempted } from "../../helpers/Auth/authFunctions";
    import { pageIn } from "../../helpers/transitions";

    let redirected = false;

    $: if (browser && $autoLoginAttempted && !$user && !redirected) {
        redirected = true;
        goto("/login", {
            replaceState: true,
        });
    }
</script>

<!-- private: keep every portal page out of search results (pages set their own titles) -->
<svelte:head>
    <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !$autoLoginAttempted}
    <Loader loaderStyle="loader_full" />
{:else if $user}
    <Nav />

    <!-- each portal page eases in when you move between them; the nav stays put -->
    {#key $page.url.pathname}
        <div in:pageIn|global>
            <slot />
        </div>
    {/key}
{/if}

