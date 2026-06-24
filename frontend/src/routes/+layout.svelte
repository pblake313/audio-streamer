<script lang="ts">
    import './styles.css';
    import { autoLogin } from '../helpers/Auth/authFunctions';
    import { onMount } from 'svelte';
    import NotificationsList from '../components/standalone/Notificaitons/NotificationsList.svelte';
    import Nav from '../components/standalone/Nav/Nav.svelte';


    onMount( async ()=> {
        await autoLogin()
    })



</script>


<Nav />

<NotificationsList />

<slot></slot>