<script lang="ts">
    import { fade } from "svelte/transition";
    import Logo from "../../../svg/Logos/Logo.svelte";
    import AudioLoader from "../AudioLoader.svelte";
    import HollowLoader from "../HollowLoader.svelte";
import SpinLoader from "../SpinLoader.svelte";

    

</script>


<style>
    .dashboardLoader{
        position: fixed;
        top: 0px;
        left: 0px;
        z-index: 9999;
        background-color: #222;
        height: 100%;
        width: 100%;
        display: flex;
        justify-content: space-evenly;
        align-items: center;
    }
    .dashboardLoadMiddle{
        text-align: center;

    }
    .holdHollowLoad{
        width: 100vw;
        max-width: 375px;
        opacity: .3;
    }
    .holdAL {

        margin: auto;
        width: 100px;
        margin-top: 20px;
        opacity: .3;
    }
</style>

<div class="dashboardLoader" in:fade={{duration: 150}} out:fade={{duration: 300}}>
    <div class="dashboardLoadMiddle">
        <div class="holdHollowLoad">
            <HollowLoader></HollowLoader>        
        </div>

        <div class="holdAL"> 
            <AudioLoader backgroundColor={'#222'}></AudioLoader>
        </div>
    </div>
</div>