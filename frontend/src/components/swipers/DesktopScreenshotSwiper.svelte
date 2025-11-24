<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import SwiperCore from "swiper";
    import { Navigation } from "swiper/modules";
    import "swiper/css";
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
        "/Images/ScreenShots/Desktop/desk8.png"
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

            // 🔥 Default slidesPerView
            slidesPerView: 2.3,
            spaceBetween: 25,
            loop: true,
            speed: 300,
            roundLengths: false,
            centeredSlides: true,
            centeredSlidesBounds: false,

            // 🔥 RESPONSIVE BREAKPOINTS
            breakpoints: {
                1600: {
                    slidesPerView: 1.5
                },
                1200: {
                    slidesPerView: 1.7
                },
                900: {
                    slidesPerView: 1.2
                },
                650: {
                    slidesPerView: 1.1,
                  
                },
                0: {
                    slidesPerView: 1.1,
                    spaceBetween: 15,

                    centeredSlides: false
                }
            },

            on: {
                init(sw) {
                    activeIndex = sw.realIndex;
                },
                slideChange(sw) {
                    activeIndex = sw.realIndex;
                }
            }
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


<div class="wrapImageSwiper" in:fade={{delay: 500, duration: 500}} out:fade={{duration: 500}}>


    <div class="megaSwipeWrap">
        <div class="swiper mobileC" bind:this={swiperContainer}>
            <div class="swiper-wrapper">
                {#each images as img, index}
                    <div class="swiper-slide singleSwiperSlide">
                        <div class="imageContainer">
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

    <div class="swiperLocation">
        <div class="innerLocationGrid">
            {#each images as _, i}
                <button
                    class="swiperNavButton {i === activeIndex ? 'active' : ''}"
                    on:click={() => goToSlide(i)}
                    aria-label={`Go to screenshot ${i + 1}`}
                />
            {/each}
        </div>

        <div class="nonDots"></div>

        <div class="swiperButtons">
            <!-- LEFT (PREVIOUS) BUTTON -->
            <div class="swiperButtonPrev">
                <SlideNavButton on:click={goPrev} />
            </div>

            <!-- RIGHT (NEXT) BUTTON -->
            <SlideNavButton on:click={goNext} />
        </div>
    </div>
</div>
