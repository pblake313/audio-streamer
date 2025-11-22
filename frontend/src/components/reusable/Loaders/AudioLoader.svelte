<script lang="ts">
    export let height: string = '2px'
    export let backgroundColor: string = '#8b8b8bd3'
</script>

<span
    class="audioLoader"
    style="height: {height}; background: {backgroundColor};"
></span>

<style>
.audioLoader {
    width: 100%;
    display: inline-block;
    position: relative;
    overflow: hidden;
    margin: 0;
    padding: 0;
    vertical-align: top;
    border-radius: 0; /* just in case */
    color: #99999963;
}

/* MOVING RECTANGULAR BAR WITH FADED ENDS */
.audioLoader::after {
    content: '';
    width: 90%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    border-radius: 0; /* no pill */

    /* single grey color, only ends fade */
    background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0)   0%,
        rgba(255, 255, 255, 0.226)  10%,
        rgba(240, 240, 240, 0.795)  45%,
        rgba(240, 240, 240, 0.795)  55%,
        rgba(255, 255, 255, 0.226)  90%,
        rgba(255, 255, 255, 0) 100%
    );

    animation: animloader 2s linear infinite;
    box-sizing: border-box;
}

@keyframes animloader {
    0% {
        left: 0;
        transform: translateX(-100%);
    }
    100% {
        left: 100%;
        transform: translateX(0%);
    }
}
</style>
