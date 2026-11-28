<script lang="ts">
    import "./MobileNavLink.css";

    export let title: string;
    export let isActive: boolean = false;
</script>

<button
    class="mnl_link"
    class:mnl_active={isActive}
    aria-current={isActive ? "page" : undefined}
    on:click
>
    {#if isActive}<span class="mnl_dot" aria-hidden="true"></span>{/if}
    {title}
</button>
