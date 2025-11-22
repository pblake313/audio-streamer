<script lang="ts">
    import InstagramIcon from "../../svg/Icons/SocialIcons/InstagramIcon.svelte";
    import LinkedinIcon from "../../svg/Icons/SocialIcons/LinkedinIcon.svelte";
    import MetaIcon from "../../svg/Icons/SocialIcons/MetaIcon.svelte";
    import XIcon from "../../svg/Icons/SocialIcons/XIcon.svelte";
  import YoutubeIcon from "../../svg/Icons/SocialIcons/YoutubeIcon.svelte";

    export let buttonType: 'meta' | 'linkedin' | 'instagram' | 'youtube' | 'x' = 'x'


</script>



{#if buttonType === 'x'}

    <a class="sooolink" target="_blank" href="https://www.google.com">
        <div class="wrapSI" style="margin-top: 5px;">
            <XIcon height={'20px'}></XIcon>
        </div>
    </a>
    
{/if}

{#if buttonType === 'meta'}

    <a class="sooolink" target="_blank" href="https://www.google.com">
        <div class="wrapSI">
            <MetaIcon  height={'25px'}></MetaIcon>
        </div>
    </a>
    
{/if}
{#if buttonType === 'instagram'}

    <a class="sooolink" target="_blank" href="https://www.google.com">
        <div class="wrapSI">
            <InstagramIcon height={'22px'}></InstagramIcon>
        </div>
    </a>
    
{/if}
{#if buttonType === 'linkedin'}

    <a class="sooolink" target="_blank" href="https://www.google.com">
        <div class="wrapSI">
            <LinkedinIcon height={'18px'}></LinkedinIcon>
        </div>
    </a>
    
{/if}
{#if buttonType === 'youtube'}

    <a class="sooolink" target="_blank" href="https://www.youtube.com/@pattsway">
        <div class="wrapSI">
            <YoutubeIcon height={'35px'}></YoutubeIcon>
        </div>
    </a>
    
{/if}

<style>
    .sooolink {
        display: block;
        width: fit-content;
        height: 30px;
        position: relative;
        border-radius: 6px;
        transition: .3s;
        display: flex;
        align-items: center;
        opacity: .9;
    }
    .wrapSI {
        display: flex;
        justify-content: space-evenly;

    }
    .sooolink:hover {
        opacity: 1;
    }

    @media(pointer: coarse) {
        .sooolink:hover {
            box-shadow: none;
        }

    }
</style>

<!-- <p>linkedin</p>
<p>twitter</p>
<p>facebook</p>
<p>ig</p> -->