<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type {Notification} from '../../../stores/NotificationStore'
    import { fly, fade } from 'svelte/transition';
    export let notification: Notification;
    import CloseButton from '../../buttons/CloseButton.svelte';
    import CheckIcon from '../../Icons/svg/CheckIcon.svelte';
    import ErrorIcon from '../../Icons/svg/ErrorIcon.svelte';
    import InfoIcon from '../../Icons/svg/InfoIcon.svelte';
    import WarningIcon from '../../Icons/svg/WarningIcon.svelte';
    import './NotificationItem.css';
  
    const dispatch = createEventDispatcher();
  
    function handleClose() {
        dispatch('close', { notificationId: notification.id });
    }
  </script>
  
<div class="singleNotification {notification.alertType.toLowerCase()}" in:fly={{ y: -200, duration: 500, opacity: 0 }} out:fade={{ duration: 500 }}>


    <div class="noteIconJoint">
        <div class="iconLeftColor"></div>

        <div class="holdIconJoint">
            {#if notification.alertType === 'Error'}
                    <ErrorIcon height='30px'></ErrorIcon>
            {:else if notification.alertType === 'Neutral'}
                    <InfoIcon height='30px'></InfoIcon>
            {:else if notification.alertType === 'Warning'}
                    <WarningIcon height='30px'></WarningIcon>
            {:else if notification.alertType === 'Success'}
                    <CheckIcon height='30px' color={'#30d158'}></CheckIcon>
            {/if}
        </div>

    </div>
    <div class="noteMessageSide">
        <div class="messageCloseFlex">
            <div class="holdNotiTitle">
                <p class="notit">{notification.title}</p>
                <p class="nmess">{notification.message}</p>

            </div>
            <CloseButton color={'222222'} on:click={handleClose}></CloseButton>
        </div>
    </div>



</div>