<script lang="ts">
    export let showMenu: boolean;
</script>

<div
    class:menuIcon_open={!showMenu}
    class="menuIcon"
    aria-hidden="true"
>
    <span></span>
    <span></span>
    <span></span>
</div>

<style>
    .menuIcon {
        position: relative;
        width: 26px;
        height: 18px;
        display: block;
        pointer-events: none;
        margin-top: 5px;
    }

    .menuIcon span {
        position: absolute;
        left: 0;
        width: 100%;
        height: 2px;
        border-radius: 2px;
        border-radius: 999px;
        background: #f7f7f7;
        transform-origin: center;
        transition:
            transform 220ms ease,
            opacity 160ms ease,
            top 220ms ease;
    }

    .menuIcon span:nth-child(1) {
        top: 0;
    }

    .menuIcon span:nth-child(2) {
        top: 8px;
    }

    .menuIcon span:nth-child(3) {
        top: 16px;
    }

    .menuIcon_open span:nth-child(1) {
        top: 8px;
        transform: rotate(45deg);
        border-radius: 2px;
    }

    .menuIcon_open span:nth-child(2) {
        opacity: 0;
        transform: scaleX(0.4);
    }

    .menuIcon_open span:nth-child(3) {
        top: 8px;
        transform: rotate(-45deg);
        border-radius: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
        .menuIcon span {
            transition: none;
        }
    }
</style>
