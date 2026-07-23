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

        /* Aligns with the right edge of a centered 1250px nav */
        right: max(25px, calc((100vw - 1250px) / 2));

        z-index: 999999;
    }

    @media (max-width: 850px) {
        .notificationsWrapper {
            top: 55px;
        }
    }

    @media (max-width: 600px) {
        .notificationsWrapper {
            width: calc(100% - 20px);
            max-width: none;
            right: 10px;
            padding: 0;
        }
    }
</style>

<div class="notificationsWrapper">
    {#each $notifications as n}
        <NotificationItem notification={n} on:close={handleNotificationClose}></NotificationItem>
    {/each}
</div>