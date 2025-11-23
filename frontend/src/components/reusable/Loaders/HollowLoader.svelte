<script lang="ts">
    import HollowLogo from "../../svg/Logos/HollowLogo.svelte";
    import AudioLoader from "./AudioLoader.svelte";


</script>


<style>
    .wrapHollow{
        width: 100%;
        margin: auto;
        position: relative;
    }
    .containLoader{
        position: absolute;
        top: 48%;
        left: 50%;
        transform: translate(-50%, -50%);
        height: calc(100% - 20px);
        width: calc(100% - 15px);
        z-index: -2;
    }

    @media(max-width: 500px){
        .containLoader {
            height: calc(100% - 10px);
            width: calc(100% - 8px);

        }
    }
</style>
        <!-- <HollowLogo></HollowLogo> -->

    <div class="wrapHollow">
        <HollowLogo></HollowLogo>

        <div class="containLoader">
            <AudioLoader height={'100%'} backgroundColor={'#99999963'}></AudioLoader>
        </div>

    </div>



