<script lang="ts">
    import { mobileNavOpen, toggleMobileNav } from "../../stores/navstore";
    import HamburgerCloseIcon from "../standalone/Nav/HamburgerCloseIcon.svelte";


</script>


<style>
    .mobileMenuToggle_button{
        background-color: transparent;
        padding: 0px;
        border: none;
        margin: 0px;
        cursor: pointer;
    }
</style>

<button class="mobileMenuToggle_button" on:click={toggleMobileNav}>
    <HamburgerCloseIcon showMenu={!$mobileNavOpen}/>
</button>
