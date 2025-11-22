<script lang="ts">
    import BoxButton from "../buttons/BoxButton.svelte";
import PattswayLogo from "../svg/Logos/Logo.svelte";


</script>

<div class="holdDenied">
    <div style="margin: auto;">
        <div class="deskPW">
            <PattswayLogo height={'60px'} color={'#f7f7f7'}></PattswayLogo>
        </div>
        <div class="mobilePW">
            <PattswayLogo height={'30px'} color={'#f7f7f7'}></PattswayLogo>
        </div>
    </div>
    <br><br><br>
    <p style="opacity: .7;">Access Denied. You are not authorized to access this content. We have public content available on our offical website (www.pattsway.com).</p>
    <br><br><br>
    <div style="width: fit-content; margin: auto;">
        <BoxButton buttonText={'Visit Official Site'} on:click={(e)=>{window.location.href = 'https://www.pattsway.com';}}></BoxButton>
    </div>
</div>

<style>
    .holdDenied {
        margin: auto;
        width: 500px;
        max-width: calc(100% - 50px);
        text-align: center;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .mobilePW {
        display: none;
    }
    @media (max-width: 550px){
        .deskPW {
            display: none;
        }
        .mobilePW {
            display: block;
        }
    }
</style>