<script lang="ts">
    import "./styles.css";
    import './Homepage.css'
    import {
        attemptingAutoLogin,
        autoLogin,
        autoLoginAttempted,
    } from "../helpers/Auth/authFunctions";
    import { onMount } from "svelte";
    import NotificationsList from "../components/standalone/Notificaitons/NotificationsList.svelte";
    import Nav from "../components/standalone/Nav/Nav.svelte";
    import Loader from "../components/loaders/Loader.svelte";
    import { fade } from "svelte/transition";
    import AudioStreamer from "../components/standalone/AudioStreamer.svelte";

    onMount(async () => {
        if (!$autoLoginAttempted) {
            await autoLogin();
        }
    });
</script> 



<NotificationsList />

{#if $attemptingAutoLogin}
    <div in:fade={{duration: 500}}>
        <Loader loaderStyle={'loader_full'}/>
    </div>
{:else}
    <div in:fade={{duration: 500, delay: 500}}>
        <Nav />
        <slot></slot>
    </div>
    
{/if}


<AudioStreamer />
