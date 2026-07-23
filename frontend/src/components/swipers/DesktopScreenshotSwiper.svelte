<script lang="ts">
    import { onMount } from "svelte";
    import SwiperCore from "swiper";
    import { Navigation } from "swiper/modules";
    import { fade } from "svelte/transition";



    // ALL IMAGES ARE CAPTURED AT 1250PX BY 700

    // @ts-ignore: CSS side-effect import for Swiper
    import "swiper/css";
    // @ts-ignore: CSS side-effect import for Swiper navigation
    import "swiper/css/navigation";

    import "./DesktopScreenshotSwiper.css";

    export let images: string[] = [
        "/Images/ScreenShots/Desktop/desk1.webp",
        "/Images/ScreenShots/Desktop/desk10.webp",
        "/Images/ScreenShots/Desktop/desk2.webp",
        "/Images/ScreenShots/Desktop/desk3.webp",
        "/Images/ScreenShots/Desktop/desk4.webp",
        "/Images/ScreenShots/Desktop/desk12.webp",
        "/Images/ScreenShots/Desktop/desk5.webp",
        "/Images/ScreenShots/Desktop/desk13.webp",
        "/Images/ScreenShots/Desktop/desk6.webp",
        "/Images/ScreenShots/Desktop/desk11.webp",
        "/Images/ScreenShots/Desktop/desk7.webp",
        "/Images/ScreenShots/Desktop/desk8.webp",
        "/Images/ScreenShots/Desktop/desk9.webp",
    ];

    let swiperContainer: HTMLDivElement;
    let swiper: SwiperCore | null = null;

    /*
        activeIndex controls the thumbnail picker.

        activeDot controls the bottom navigation dots because Swiper
        can have fewer snap points than images when slidesPerView
        is greater than 1.
    */
    let activeIndex = 0;
    let activeDot = 0;
    let dotCount = 0;

    function updateNavigationState(sw: SwiperCore) {
        activeIndex = sw.realIndex;
        activeDot = sw.snapIndex;
        dotCount = sw.snapGrid.length;
    }

    function goToSlide(index: number) {
        if (!swiper) return;

        swiper.slideTo(index);
    }

    function goToDot(index: number) {
        if (!swiper) return;

        swiper.slideTo(index);
    }

    onMount(() => {
        swiper = new SwiperCore(swiperContainer, {
            modules: [Navigation],

            slidesPerView: 1,
            slidesPerGroup: 1,
            spaceBetween: 15,
            loop: false,
            speed: 300,
            centeredSlides: false,
            centeredSlidesBounds: false,
            roundLengths: true,

            breakpoints: {
                1600: {
                    slidesPerView: 1,
                },

                1200: {
                    slidesPerView: 1,
                },

                900: {
                    slidesPerView: 1.2,
                },

                650: {
                    slidesPerView: 1.1,
                },

                0: {
                    slidesPerView: 1.1,
                    spaceBetween: 15,
                    centeredSlides: false,
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
        <div
            class="dss_slidePicker"
            aria-label="Screenshot picker"
        >
            {#each images as img, index}
                <button
                    type="button"
                    class="dss_slidePickerButton {index === activeIndex
                        ? 'dss_slidePickerButtonActive'
                        : ''}"
                    on:click={() => goToSlide(index)}
                    aria-label={`View screenshot ${index + 1}`}
                    aria-pressed={index === activeIndex}
                >
                    <img
                        src={img}
                        alt={`Screenshot thumbnail ${index + 1}`}
                        loading="lazy"
                    />
                </button>
            {/each}
        </div>

        <div class="dss_megaSwipeWrap">
            <div
                class="swiper dss_swiper"
                bind:this={swiperContainer}
            >
                <div class="swiper-wrapper dss_swiperWrapper">
                    {#each images as img, index}
                        <div class="swiper-slide dss_singleSwiperSlide">
                            <div class="dss_imageContainer">
                                <img
                                    src={img}
                                    alt={`Screenshot ${index + 1}`}
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="dss_swiperLocation">
            <div
                class="dss_innerLocationGrid"
                aria-label="Screenshot navigation"
            >
                {#each Array(dotCount) as _, index}
                    <button
                        type="button"
                        class:dss_active={index === activeDot}
                        class="dss_swiperNavButton"
                        on:click={() => goToDot(index)}
                        aria-label={`Go to screenshot position ${index + 1}`}
                        aria-pressed={index === activeDot}
                    />
                {/each}
            </div>
        </div>
    </div>
</div>