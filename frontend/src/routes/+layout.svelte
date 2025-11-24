<script lang="ts">
    import './styles.css';
    import { attemptingAutoLogin, autoLogin, autoLoginAttempted } from '../helpers/Auth/authFunctions';
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import NotificationsList from '../components/standalone/Notificaitons/NotificationsList.svelte';
    import FullPageLoader from '../components/loaders/PageLoaders/FullPageLoader.svelte';


    onMount( async ()=> {
        try {
            if (!$autoLoginAttempted){
                await autoLogin()
            }
        } catch {

        }
    })



</script>


{#if !$attemptingAutoLogin}
    <div in:fade={{duration: 500, delay: 700}}>
        <slot></slot>
    </div>
{:else}
    <FullPageLoader loadingText={'Attempting Auto Login'}></FullPageLoader>
{/if}

<NotificationsList></NotificationsList>