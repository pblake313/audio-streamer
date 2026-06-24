<script lang="ts">
    import { onMount } from "svelte";
    import lottie from "lottie-web";
    import loaderLottie from "./loader.json";

    import "./Loader.css";

    export let height: string = "50px";
    export let color: string = "#f7f7f7";

    export let loaderStyle:
        | null
        | "loader_center"
        | "loader_dash"
        | "loader_full"
        | "loader_padTop"
        | "loader_dashWithFooter" = "loader_center";

    export let text: string | null = null;

    let container: HTMLDivElement;

    onMount(() => {
        const animation = lottie.loadAnimation({
            container,
            renderer: "svg",
            loop: true,
            autoplay: true,
            animationData: loaderLottie,
        });

        animation.setSpeed(0.6);

        animation.addEventListener("DOMLoaded", () => {
            const paths = container.querySelectorAll<SVGPathElement>("path");

            paths.forEach((path) => {
                path.setAttribute("stroke", color);
            });
        });

        return () => animation.destroy();
    });
</script>

<div class={loaderStyle || ""}>
    <div class="loader_container">
        <div bind:this={container} style={`height:${height}; width:${height};`}></div>

        {#if text}
            <div class="loader_wrapText">
                <p>{text}</p>
            </div>
        {/if}
    </div>
</div>