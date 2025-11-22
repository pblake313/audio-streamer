<script lang="ts">
    import { goto } from "$app/navigation";
    import AddIcon from "../../svg/Icons/AddIcon.svelte";
    import { createEventDispatcher } from "svelte";
    export let buttonStyle: 'ghost' | 'dark' | 'stayDark' | 'transBack' = 'ghost';
    export let linkTo: string = '/';
    export let icon: 'add' | null = null;
    export let buttonText: string = 'Enter Button Text';
    export let bigPad: boolean = false;
    export let fullWidth: boolean = false;

    const dispatch = createEventDispatcher();

    const handleClick = (event: MouseEvent) => {
        event.preventDefault();
        dispatch('beforeRoute');
        goto(linkTo);
    };
</script>

<button on:click={handleClick} class="sbu {buttonStyle}" class:bigPad={bigPad} class:goFullWide={fullWidth}>
    <div class="crumbutFlex">
        {#if icon === 'add'}
            <AddIcon height={'20px'} />
        {/if}
        <p class:addmarg={icon && buttonText !== ''}>{buttonText}</p>
    </div>
</button>


<style> 
    .sbu {
        display: block;
        padding: 5px 10px;
        height: fit-content;
        border-radius: 6px;
        overflow: hidden;
        transition: .5s;
        width: fit-content;
        text-decoration: none;
        border: 1px solid transparent;
        display: flex;        
        cursor: pointer;
        justify-content: space-evenly;
        margin-top: 2px;
    }

    p {
        margin-top: 3px;
        transition: .3s;
    }
    .crumbutFlex {
        display: flex;
        align-items: center;
    }
    .addmarg {
        margin-left: 12px;
    }

    .ghost {
        opacity: .7;
        font-weight: bold;
    }
    .ghost:hover {
        box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.176);
        cursor: pointer;
        opacity: 1;
    }
    .dark {
        background-color: #222222;
    }
    .dark:hover {
        background-color: transparent;
        border: 1px solid #222222;
    }
    .dark .crumbutFlex p {
        color: #e8e8e8;
    }
    .dark:hover .crumbutFlex p {
        color: #222222;
    }

    .stayDark {
        background-color: #222222;
    }
    .stayDark:hover {
        border: 1px solid #141414;
    }
    .stayDark .crumbutFlex p {
        color: #e8e8e8;
    }
    .transBack {
        background-color: #eeeeee;
        border: 1px solid #eeeeee;
    }
    .transBack:hover {
        background-color: #eeeeee;
    }
    .transBack .crumbutFlex p {
        color: #222222;
    }
    .transBack:hover .crumbutFlex p {
        color: #222222;
    }

    /* these need to stay at the bottom */
    .bigPad {
        padding: 14px 18px;
    }
    .bigPad.goFullWide{
        width: calc(100%);
    }
</style>