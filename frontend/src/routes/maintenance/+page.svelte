<script lang="ts">
    import type { PageData } from "./$types";
    import { onMount } from "svelte";

    import "../styles.css";
    import "./UnderConstruction.css";
    import Logo from "../../components/Icons/Logos/Logo.svelte";

    onMount(() => {});
</script>

<!-- THIS ROUTE IS UNNECCESSARY TO RUN THE AUDIO STREAMER AND CAN BE DELETED -->
<!-- This is for my main app, pattsway.com as my under construction page. -->

<div class="underConstruction_container">
    <div class="underConstruction_insideContainer">
        <div class="underConstruction_deskLogo">
            <Logo width={"50%"} />
        </div>
        <div class="underConstruction_mobileLogo">
            <Logo width={"70%"} />
        </div>
        <p>
            Our site is currently undergoing maintenance. We should be up and
            running shortly. Sorry for the inconveinence.
        </p>
    </div>
</div>
