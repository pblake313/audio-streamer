<script lang="ts">
    import './styles.css';
    import { attemptingAutoLogin, autoLogin, autoLoginAttempted } from '../helpers/Auth/authFunctions';
    import FullPageLoader from '../components/reusable/Loaders/PageLoaders/FullPageLoader.svelte';
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';


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
