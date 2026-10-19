<script lang="ts">
    import { onMount } from "svelte";
    import SwiperCore from "swiper";
    import { Keyboard } from "swiper/modules";
    import { fade } from "svelte/transition";

    import SwiperControls from "./SwiperControls.svelte";
    import ScreenshotLightbox from "./ScreenshotLightbox.svelte";

    // ALL IMAGES ARE CAPTURED AT 1250PX BY 700

    // @ts-ignore: CSS side-effect import for Swiper
    import "swiper/css";

    import "./DesktopScreenshotSwiper.css";

    export let images: string[] = [
        "/Images/ScreenShots/Desktop/desk1.webp",
        "/Images/ScreenShots/Desktop/desk2.webp",
        "/Images/ScreenShots/Desktop/desk3.webp",
        "/Images/ScreenShots/Desktop/desk4.webp",
        "/Images/ScreenShots/Desktop/desk5.webp",
        "/Images/ScreenShots/Desktop/desk6.webp",
        "/Images/ScreenShots/Desktop/desk7.webp",
        "/Images/ScreenShots/Desktop/desk8.webp",
        "/Images/ScreenShots/Desktop/desk9.webp",
        "/Images/ScreenShots/Desktop/desk10.webp",
        "/Images/ScreenShots/Desktop/desk11.webp",
        "/Images/ScreenShots/Desktop/desk12.webp",
        "/Images/ScreenShots/Desktop/desk13.webp",
    ];

    let swiperContainer: HTMLDivElement;
    let swiper: SwiperCore | null = null;

    /*
        The counter uses snapIndex and snapGrid because Swiper can
        have fewer snap points than images when more than one slide
        fits in view.
    */
    let snapIndex = 0;
    let snapCount = 0;
    let isBeginning = true;
    let isEnd = false;

    function updateNavigationState(sw: SwiperCore) {
        snapIndex = sw.snapIndex;
        snapCount = sw.snapGrid.length;
        isBeginning = sw.isBeginning;
        isEnd = sw.isEnd;
    }

    // ---------------------------------------------
    // lightbox
    // Swiper cancels the click after a drag, so only
    // a real click/tap on a slide opens it.
    // ---------------------------------------------
    let lightboxIndex: number | null = null;

    function openLightbox(index: number) {
        lightboxIndex = index;

        // the lightbox handles the arrow keys while it's open
        swiper?.keyboard.disable();
    }

    function closeLightbox(index: number) {
        lightboxIndex = null;

        swiper?.keyboard.enable();
        swiper?.slideTo(index);
    }

    onMount(() => {
        swiper = new SwiperCore(swiperContainer, {
            modules: [Keyboard],

            // slide widths come from CSS so they can be capped by the viewport height
            slidesPerView: "auto",
            spaceBetween: 12,
            loop: false,
            speed: 500,
            roundLengths: true,
            grabCursor: true,
            keyboard: { enabled: true, onlyInViewport: true },

            breakpoints: {
                1200: {
                    spaceBetween: 28,
                },

                900: {
                    spaceBetween: 22,
                },

                650: {
                    spaceBetween: 16,
                },
            },

            on: {
                init: updateNavigationState,
                slideChange: updateNavigationState,
                reachBeginning: updateNavigationState,
                reachEnd: updateNavigationState,
                fromEdge: updateNavigationState,
                breakpoint: updateNavigationState,
                update: updateNavigationState,
            },
        });

        /*
            Swiper only watches the container's width, so a height-only
            resize would leave stale slide sizes. Re-measure on window resize.
        */
        const handleResize = () => swiper?.update();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            swiper?.destroy(true, true);
            swiper = null;
        };
    });
</script>

<div class="dss_megaContainer">
    <div
        class="dss_container"
        in:fade={{ delay: 500, duration: 500 }}
        out:fade={{ duration: 500 }}
    >
        <div class="swiper dss_swiper" bind:this={swiperContainer}>
            <div class="swiper-wrapper">
                {#each images as img, index}
                    <div class="swiper-slide dss_slide">
                        <button
                            type="button"
                            class="dss_window"
                            on:click={() => openLightbox(index)}
                            aria-label={`Enlarge desktop screenshot ${index + 1}`}
                        >
                            <span class="dss_windowBar" aria-hidden="true">
                                <span class="dss_windowDot" />
                                <span class="dss_windowDot" />
                                <span class="dss_windowDot" />
                            </span>

                            <span class="dss_imageContainer">
                                <img
                                    src={img}
                                    alt={`Desktop screenshot ${index + 1} of ${images.length}`}
                                    width="1250"
                                    height="700"
                                    loading={index < 2 ? "eager" : "lazy"}
                                    draggable="false"
                                />
                            </span>
                        </button>
                    </div>
                {/each}
            </div>
        </div>

        <SwiperControls
            current={snapIndex}
            total={snapCount}
            {isBeginning}
            {isEnd}
            onPrev={() => swiper?.slidePrev()}
            onNext={() => swiper?.slideNext()}
        />
    </div>
</div>

{#if lightboxIndex !== null}
    <ScreenshotLightbox
        {images}
        index={lightboxIndex}
        label="Desktop screenshot"
        onClose={closeLightbox}
    />
{/if}
