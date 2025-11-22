<script lang="ts">
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';
    import BoxButton from '../buttons/BoxButton.svelte';

    import './PageHeading.css';

    export let title: string = 'Enter `title`';
    export let subtitle: string = 'Enter your  `subtitle` prop!';

    export let buttonText: string = 'Enter `buttonText`';
    export let buttonLink: string = '/';
    export let bottomPad: boolean = true;
    export let topPad: boolean = true;

    export let useButton: boolean = true;

    // 👇 parent can pass this in
    export let onButtonClick: ((value: string) => void) | undefined = undefined;

    function handleButtonClick() {
        // send value up to parent if provided
        onButtonClick?.(buttonLink);
    }
</script>

<div
    class="pageStandardWrap"
    in:fade={{ duration: 300, delay: 150 }}
    out:fade={{ duration: 150 }}
    class:noTopPd={!topPad}
>
    <h3 class="shoppingATitle">{title}</h3>
    <br />
    <div class="wrapBottomUp" class:noPageBottomPad={!bottomPad}>
        <p class="pageStandardSub">{subtitle}</p>

        {#if useButton}
            <div class="wrapPHButton">
                <BoxButton
                    fullWidth={true}
                    buttonText={buttonText}
                    on:click={handleButtonClick}
                />
            </div>
        {/if}
    </div>
</div>
