<script lang="ts">
    import { page } from "$app/stores";
    import { scrollToHash } from "../../helpers/scrollToHash";
    import "./NavigationLink.css";
    import "./NavDropdown.css";

    type DropdownItem = { label: string; linksTo: string };

    export let label: string;
    export let items: DropdownItem[];
    export let activeHash = "";

    let open = false;
    let root: HTMLDivElement;

    const menuId = `navDropdown_${Math.random().toString(36).slice(2, 8)}`;

    function itemIsActive(linksTo: string, hash: string, pathname: string) {
        const url = new URL(linksTo, "http://x");
        return url.pathname === pathname && url.hash === hash;
    }

    $: anyActive = items.some((item) =>
        itemIsActive(item.linksTo, activeHash, $page.url.pathname),
    );

    function handleItemClick(event: MouseEvent, linksTo: string) {
        event.preventDefault();
        open = false;
        scrollToHash(linksTo);
    }

    function handleWindowClick(event: MouseEvent) {
        if (open && root && !root.contains(event.target as Node)) {
            open = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && open) {
            open = false;
            root?.querySelector<HTMLButtonElement>(".navDropdown_trigger")?.focus();
        }
    }
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleKeydown} />

<div class="navDropdown" bind:this={root}>
    <button
        type="button"
        class="navLink navDropdown_trigger"
        class:active={anyActive}
        class:navDropdown_open={open}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        on:click={() => (open = !open)}
    >
        {label}
        <svg
            class="navDropdown_chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d="M6 9l6 6 6-6" />
        </svg>
    </button>

    <div class="navDropdown_menu" class:navDropdown_menuOpen={open} id={menuId}>
        {#each items as item}
            <a
                href={item.linksTo}
                class="navDropdown_item"
                class:navDropdown_itemActive={itemIsActive(
                    item.linksTo,
                    activeHash,
                    $page.url.pathname,
                )}
                tabindex={open ? 0 : -1}
                on:click={(e) => handleItemClick(e, item.linksTo)}
            >
                {item.label}
            </a>
        {/each}
    </div>
</div>
