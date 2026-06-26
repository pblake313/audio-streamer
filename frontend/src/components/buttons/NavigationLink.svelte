<script lang="ts">
    import { page } from "$app/stores";
    import "./NavigationLink.css";

    export let linksTo: string;
    export let linkText: string;

    $: isActive = $page.url.pathname === linksTo;
</script>

<a
    href={linksTo}
    class="navLink"
    class:active={isActive}
>
    {linkText}
</a>