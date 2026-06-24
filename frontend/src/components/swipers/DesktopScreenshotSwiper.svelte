<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import SwiperCore from "swiper";
    import { Navigation } from "swiper/modules";
    // @ts-ignore: CSS side-effect import for Swiper
    import "swiper/css";
    // @ts-ignore: CSS side-effect import for Swiper navigation
    import "swiper/css/navigation";
    import "./DesktopScreenshotSwiper.css";
    import SlideNavButton from "../buttons/SlideNavButton.svelte";
    import { fade } from "svelte/transition";

    export let images: string[] = [
        "/Images/ScreenShots/Desktop/desk0.png",
        "/Images/ScreenShots/Desktop/desk2.png",
        "/Images/ScreenShots/Desktop/desk3.png",
        "/Images/ScreenShots/Desktop/desk5.png",
        "/Images/ScreenShots/Desktop/desk1.png",
        "/Images/ScreenShots/Desktop/desk6.png",
        "/Images/ScreenShots/Desktop/desk4.png",
        "/Images/ScreenShots/Desktop/desk7.png",
        "/Images/ScreenShots/Desktop/desk8.png",
    ];

    let swiperContainer: HTMLDivElement;
    let swiper: SwiperCore | null = null;
    let activeIndex = 0;

    function goNext() {
        swiper?.slideNext();
    }

    function goPrev() {
        swiper?.slidePrev();
    }

    function goToSlide(index: number) {
        swiper?.slideToLoop(index);
    }

    onMount(() => {
        swiper = new SwiperCore(swiperContainer, {
            modules: [Navigation],

            slidesPerView: 2.3,
            spaceBetween: 15,
            loop: false,
            speed: 300,
            roundLengths: false,
            centeredSlides: false,
            centeredSlidesBounds: false,

            breakpoints: {
                1600: {
                    slidesPerView: 1.2,
                },
                1200: {
                    slidesPerView: 1.4,
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
                    activeIndex = sw.realIndex;
                },
                slideChange(sw) {
                    activeIndex = sw.realIndex;
                },
            },
        });

        return () => {
            swiper?.destroy(true, true);
            swiper = null;
        };
    });

    onDestroy(() => {
        swiper?.destroy(true, true);
        swiper = null;
    });
</script>

<div
    class="dss_container"
    in:fade={{ delay: 500, duration: 500 }}
    out:fade={{ duration: 500 }}
>
    <div class="dss_megaSwipeWrap">
        <div class="swiper dss_swiper" bind:this={swiperContainer}>
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
        <div class="dss_innerLocationGrid">
            {#each images as _, i}
                <button
                    class="dss_swiperNavButton {i === activeIndex ? 'dss_active' : ''}"
                    on:click={() => goToSlide(i)}
                    aria-label={`Go to screenshot ${i + 1}`}
                />
            {/each}
        </div>

        <div class="dss_nonDots"></div>

        <div class="dss_swiperButtons">
            <div class="dss_swiperButtonPrev">
                <SlideNavButton on:click={goPrev} />
            </div>

            <SlideNavButton on:click={goNext} />
        </div>
    </div>
</div>