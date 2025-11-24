<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import SwiperCore from "swiper";
    import { Navigation } from "swiper/modules";
    import "swiper/css";
    import "swiper/css/navigation";
    import "./MobileScreenshotSwiper.css";
    import SlideNavButton from "../buttons/SlideNavButton.svelte";
    import { fade } from "svelte/transition";

    export let images: string[] = [
        "/Images/ScreenShots/Mobile/mob0.png",
        "/Images/ScreenShots/Mobile/mob5.png",
        "/Images/ScreenShots/Mobile/mob8.png",
        "/Images/ScreenShots/Mobile/mob1.png",
        "/Images/ScreenShots/Mobile/mob2.png",
        "/Images/ScreenShots/Mobile/mob6.png",
        "/Images/ScreenShots/Mobile/mob7.png",
        "/Images/ScreenShots/Mobile/mob3.png",
        "/Images/ScreenShots/Mobile/mob4.png",
        "/Images/ScreenShots/Mobile/mob9.png"
    ];

    let mobileSwiperContainer: HTMLDivElement;
    let mobileSwiper: SwiperCore | null = null;
    let mobileActiveIndex = 0;

    function goNext() {
        mobileSwiper?.slideNext();
    }

    function goPrev() {
        mobileSwiper?.slidePrev();
    }

    function goToSlide(index: number) {
        mobileSwiper?.slideToLoop(index);
    }

    onMount(() => {
        mobileSwiper = new SwiperCore(mobileSwiperContainer, {
            modules: [Navigation],

            slidesPerView:5,
            spaceBetween: 25,
            loop: true,
            speed: 300,
            roundLengths: false,
            centeredSlides: true,
            centeredSlidesBounds: false,

            breakpoints: {
                1600: {
                    slidesPerView: 4.5
                },
                1200: {
                    slidesPerView: 4.5
                },
                900: {
                    slidesPerView: 4
                },
                600: {
                    slidesPerView: 2,
                    spaceBetween: 25
                },
                0: {
                    slidesPerView: 1.2,

                    centeredSlides: false,

                    spaceBetween: 15
                }
            },

            on: {
                init(sw) {
                    mobileActiveIndex = sw.realIndex;
                },
                slideChange(sw) {
                    mobileActiveIndex = sw.realIndex;
                }
            }
        });

        return () => {
            mobileSwiper?.destroy(true, true);
            mobileSwiper = null;
        };
    });

    onDestroy(() => {
        mobileSwiper?.destroy(true, true);
        mobileSwiper = null;
    });
</script>

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
            <div class="swiper-wrapper">
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
        <div class="mobileScreenshotDots">
            {#each images as _, i}
                <button
                    class="mobileScreenshotDot {i === mobileActiveIndex ? 'active' : ''}"
                    on:click={() => goToSlide(i)}
                    aria-label={`Go to screenshot ${i + 1}`}
                />
            {/each}
        </div>
        <div class="nonDots"></div>

        <div class="mobileScreenshotButtons">
            <div class="mobileScreenshotButtonPrev">
                <SlideNavButton on:click={goPrev} />
            </div>

            <SlideNavButton on:click={goNext} />
        </div>
    </div>
</div>
