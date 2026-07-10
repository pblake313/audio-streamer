<script lang="ts">
    import { onMount } from "svelte";
    import SwiperCore from "swiper";
    import { fade } from "svelte/transition";

    // @ts-ignore: CSS side-effect import for Swiper
    import "swiper/css";

    import "./MobileScreenshotSwiper.css";

    export let images: string[] = [
        "/Images/ScreenShots/Mobile/mobile2.webp",
        "/Images/ScreenShots/Mobile/mobile3.webp",
        "/Images/ScreenShots/Mobile/mobile4.webp",
        "/Images/ScreenShots/Mobile/mobile5.webp",
        "/Images/ScreenShots/Mobile/mobile6.webp",
        "/Images/ScreenShots/Mobile/mobile7.webp",
        "/Images/ScreenShots/Mobile/mobile8.webp",
        "/Images/ScreenShots/Mobile/mobile1.webp",
        "/Images/ScreenShots/Mobile/mobile9.webp",
        "/Images/ScreenShots/Mobile/mobile10.webp",
        "/Images/ScreenShots/Mobile/mobile11.webp",
    ];

    let mobileSwiperContainer: HTMLDivElement;
    let mobileSwiper: SwiperCore | null = null;

    /*
        Swiper can have fewer snap positions than images when
        multiple slides are visible.

        Use snapIndex and snapGrid so the dots match the actual
        available swiper positions.
    */
    let mobileActiveDot = 0;
    let mobileDotCount = 0;

    function updateNavigationState(sw: SwiperCore) {
        mobileActiveDot = sw.snapIndex;
        mobileDotCount = sw.snapGrid.length;
    }

    function goToSlide(dotIndex: number) {
        if (!mobileSwiper) return;

        /*
            slidesPerGroup is 1, so the snap position maps to
            the matching slide index.
        */
        mobileSwiper.slideTo(dotIndex);
    }

    onMount(() => {
        mobileSwiper = new SwiperCore(mobileSwiperContainer, {
            slidesPerView: 5,
            slidesPerGroup: 1,
            spaceBetween: 15,
            loop: false,
            speed: 300,
            roundLengths: true,
            centeredSlides: false,
            centeredSlidesBounds: false,

            breakpoints: {
                1600: {
                    slidesPerView: 5,
                },

                1300: {
                    slidesPerView: 5,
                },

                900: {
                    slidesPerView: 4.5,
                },

                600: {
                    slidesPerView: 2.7,
                },

                450: {
                    slidesPerView: 1.8,
                },

                0: {
                    slidesPerView: 1.4,
                },
            },

            on: {
                init(sw) {
                    updateNavigationState(sw);
                },

                slideChange(sw) {
                    updateNavigationState(sw);
                },

                reachBeginning(sw) {
                    updateNavigationState(sw);
                },

                reachEnd(sw) {
                    updateNavigationState(sw);
                },

                fromEdge(sw) {
                    updateNavigationState(sw);
                },

                resize(sw) {
                    updateNavigationState(sw);
                },

                breakpoint(sw) {
                    updateNavigationState(sw);
                },

                update(sw) {
                    updateNavigationState(sw);
                },
            },
        });

        return () => {
            mobileSwiper?.destroy(true, true);
            mobileSwiper = null;
        };
    });
</script>

<div class="mobileScreenshotMegaContainer">
    <div
        class="mobileScreenshotWrapper"
        in:fade={{ delay: 500, duration: 500 }}
        out:fade={{ duration: 500 }}
    >
        <div class="mobileScreenshotMegaWrap">
            <div
                class="swiper mobileScreenshotSwiperInstance"
                bind:this={mobileSwiperContainer}
            >
                <div class="swiper-wrapper mobileScreenshotSwiperWrapper">
                    {#each images as img, index}
                        <div class="swiper-slide mobileScreenshotSlide">
                            <div class="mobileScreenshotImageContainer">
                                <img
                                    src={img}
                                    alt={`Mobile screenshot ${index + 1}`}
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="mobileScreenshotLocation">
            <div
                class="mobileScreenshotDots"
                aria-label="Mobile screenshot navigation"
            >
                {#each Array(mobileDotCount) as _, index}
                    <button
                        type="button"
                        class="mobileScreenshotDot"
                        class:active={index === mobileActiveDot}
                        on:click={() => goToSlide(index)}
                        aria-label={`Go to mobile screenshot position ${index + 1}`}
                        aria-pressed={index === mobileActiveDot}
                    />
                {/each}
            </div>
        </div>
    </div>
</div>