<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import "./BackgroundVideo.css";

    /*
        Decorative looping background video that never shows a play button.

        The poster (the video's first frame) shows first; the video is only
        made visible once it's actually playing. If the browser won't
        autoplay (iOS Low Power Mode, data saver, ...), where Safari would
        show its play button, the still image just stays.
    */
    export let src: string;
    export let poster: string;
    // sizing / positioning class, applied to both the image and the video
    export let className = "";
    export let fadeDuration = 0;
    export let fadeDelay = 0;
    // called once there's something to show (the poster or the video)
    export let onReady: () => void = () => {};

    let video: HTMLVideoElement;
    let playing = false;

    onMount(() => {
        // muted + playsinline normally autoplays; if it's blocked, keep the image
        video?.play().catch(() => {});
    });
</script>

<img
    class="{className} bgv_poster"
    src={poster}
    alt=""
    aria-hidden="true"
    draggable="false"
    on:load={onReady}
    in:fade|global={{ duration: fadeDuration, delay: fadeDelay }}
/>

<video
    bind:this={video}
    class="{className} bgv_video"
    class:bgv_waiting={!playing}
    {src}
    {poster}
    autoplay
    loop
    muted
    playsinline
    disablepictureinpicture
    disableremoteplayback
    aria-hidden="true"
    tabindex="-1"
    on:playing={() => {
        playing = true;
        onReady();
    }}
    in:fade|global={{ duration: fadeDuration, delay: fadeDelay }}
></video>
