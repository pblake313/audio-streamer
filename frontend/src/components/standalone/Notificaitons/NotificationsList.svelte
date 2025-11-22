<script lang="ts">
    import NotificationItem from './NotificationItem.svelte';
    import { notifications, removeNotification } from '../../../stores/NotificationStore'

    interface CloseEventDetail {
        notificationId: string;
    }

    // Define the event type for Svelte's dispatch mechanism
    interface NotificationItemEventMap {
        close: CustomEvent<CloseEventDetail>;
    }

    function handleNotificationClose(event: NotificationItemEventMap['close']) {
        removeNotification(event.detail.notificationId)
    }
</script>

<style>
    .notificationsWrapper {
        position: fixed;
        width: 400px;
        top: 75px;
        right: calc((100vw - 1600px) / 2 + 25px); /* This offsets it relative to centered content */
        z-index: 999999;
    }

    @media (max-width: 1850px){
        .notificationsWrapper {
            max-width: 400px;
            margin: auto;
            right: 25px;
        }
    }
    @media(max-width: 850px){
        .notificationsWrapper {
            top: 55px;
        }
    }
    @media (max-width: 600px) {
        .notificationsWrapper{
            width: calc(100% - 25px);
            max-width: 100%;
            right: 0px;
            padding: 0px 10px;
        }
    }
</style>

<div class="notificationsWrapper">
    {#each $notifications as n}
        <NotificationItem notification={n} on:close={handleNotificationClose}></NotificationItem>
    {/each}
</div>