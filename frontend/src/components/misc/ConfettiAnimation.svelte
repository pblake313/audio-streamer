<script lang="ts">
    import { onMount } from "svelte";
    import lottie from "lottie-web";
    import confetti from "./confetti.json";

    let container: HTMLDivElement;

    onMount(() => {
        const anim = lottie.loadAnimation({
            container,
            animationData: confetti,
            renderer: "svg",
            loop: false, // play only once
            autoplay: true, // start immediately
        });

        // Optional: cleanup on destroy
        return () => anim.destroy();
    });
</script>

<div bind:this={container} style="width: 100%; height: 100%"></div>
