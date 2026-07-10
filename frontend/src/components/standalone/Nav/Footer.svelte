<script lang="ts">
    import { showAudioPlayer } from "../../../stores/AudioPlayer/BeatsStore";
    import Logo from "../../Icons/Logos/Logo.svelte";
    import "./Footer.css";

    const year = new Date().getFullYear();
</script>

<div class="footer_container" >
    <div class="footer_insideContainer">
        <p class="footer_eyebrow">A project by</p>
        <a href="https://www.pattsway.com" class="footer_containLogo">
            <Logo color={"#f7f7f7"} width={"100%"} />
        </a>
        <div class="footer_bottomFade"></div>
    </div>
</div>

<p style="text-align: center; opacity: .3; font-size: 10pt; padding-bottom: 5px;" >
    All Rights Reserved | Copyright © {year} PATTSWAY
</p>

<div class:footer_padForPlayer={$showAudioPlayer}></div>
