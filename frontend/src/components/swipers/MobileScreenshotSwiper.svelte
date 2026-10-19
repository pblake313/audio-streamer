<script lang="ts">
    import { onMount } from "svelte";
    import SwiperCore from "swiper";
    import { Keyboard } from "swiper/modules";
    import { fade } from "svelte/transition";

    import SwiperControls from "./SwiperControls.svelte";
    import ScreenshotLightbox from "./ScreenshotLightbox.svelte";

    // @ts-ignore: CSS side-effect import for Swiper
    import "swiper/css";

    import "./MobileScreenshotSwiper.css";

    // ALL IMAGES ARE CAPTURED AT 390PX BY 800PX

    export let images: string[] = [
        "/Images/ScreenShots/Mobile/mobile1.webp",
        "/Images/ScreenShots/Mobile/mobile2.webp",
        "/Images/ScreenShots/Mobile/mobile3.webp",
        "/Images/ScreenShots/Mobile/mobile4.webp",
        "/Images/ScreenShots/Mobile/mobile5.webp",
        "/Images/ScreenShots/Mobile/mobile6.webp",
        "/Images/ScreenShots/Mobile/mobile7.webp",
        "/Images/ScreenShots/Mobile/mobile8.webp",
        "/Images/ScreenShots/Mobile/mobile9.webp",
        "/Images/ScreenShots/Mobile/mobile10.webp",
        "/Images/ScreenShots/Mobile/mobile11.webp",
        "/Images/ScreenShots/Mobile/mobile13.webp",
        "/Images/ScreenShots/Mobile/mobile14.webp",
    ];

    let mobileSwiperContainer: HTMLDivElement;
    let mobileSwiper: SwiperCore | null = null;

    /*
        Swiper can have fewer snap positions than images when
        multiple slides are visible, so progress is based on
        snapIndex and snapGrid rather than the slide index.
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
        mobileSwiper?.keyboard.disable();
    }

    function closeLightbox(index: number) {
        lightboxIndex = null;

        mobileSwiper?.keyboard.enable();
        mobileSwiper?.slideTo(index);
    }

    onMount(() => {
        mobileSwiper = new SwiperCore(mobileSwiperContainer, {
            modules: [Keyboard],

            // slide widths come from CSS so they can be capped by the viewport height
            slidesPerView: "auto",
            slidesPerGroup: 1,
            spaceBetween: 14,
            loop: false,
            speed: 450,
            roundLengths: true,
            grabCursor: true,
            keyboard: { enabled: true, onlyInViewport: true },

            // keep these gaps in sync with --mss-gap in the CSS
            breakpoints: {
                1300: {
                    spaceBetween: 22,
                },

                900: {
                    spaceBetween: 20,
                },

                600: {
                    spaceBetween: 18,
                },
            },

            on: {
                init: updateNavigationState,
                slideChange: updateNavigationState,
                reachBeginning: updateNavigationState,
                reachEnd: updateNavigationState,
                fromEdge: updateNavigationState,
                resize: updateNavigationState,
                breakpoint: updateNavigationState,
            },
        });

        /*
            Swiper only watches the container's width, so a height-only
            resize would leave stale slide sizes. Re-measure on window resize.
        */
        const handleResize = () => mobileSwiper?.update();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            mobileSwiper?.destroy(true, true);
            mobileSwiper = null;
        };
    });
</script>

<div class="mss_megaContainer">
    <div
        class="mss_container"
        in:fade={{ delay: 500, duration: 500 }}
        out:fade={{ duration: 500 }}
    >
        <div class="swiper mss_swiper" bind:this={mobileSwiperContainer}>
            <div class="swiper-wrapper">
                {#each images as img, index}
                    <div class="swiper-slide mss_slide">
                        <button
                            type="button"
                            class="mss_phone"
                            on:click={() => openLightbox(index)}
                            aria-label={`Enlarge mobile screenshot ${index + 1}`}
                        >
                            <span class="mss_screen">
                                <img
                                    src={img}
                                    alt={`Mobile screenshot ${index + 1} of ${images.length}`}
                                    width="390"
                                    height="800"
                                    loading={index < 5 ? "eager" : "lazy"}
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
            showCount={false}
            label="mobile screenshots"
            onPrev={() => mobileSwiper?.slidePrev()}
            onNext={() => mobileSwiper?.slideNext()}
        />
    </div>
</div>

{#if lightboxIndex !== null}
    <ScreenshotLightbox
        {images}
        index={lightboxIndex}
        label="Mobile screenshot"
        onClose={closeLightbox}
    />
{/if}
