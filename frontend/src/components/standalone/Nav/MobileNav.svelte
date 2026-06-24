<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import { closeMobileNav, mobileNavOpen } from '../../../stores/navstore';
    import './MobileNav.css';
    import Logo from '../../Icons/Logos/Logo.svelte';
    import { goto } from '$app/navigation';

    function goToPage(path: string) {
        goto(path);
        closeMobileNav();
    }

    function handleWindowClick() {
        closeMobileNav();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeMobileNav();
        }
    }

    onMount(() => {
        // Prevent the same click that opened the nav from instantly closing it
        const timeout = window.setTimeout(() => {
            window.addEventListener('click', handleWindowClick);
            window.addEventListener('keydown', handleKeydown);
        }, 0);

        return () => {
            window.clearTimeout(timeout);
            window.removeEventListener('click', handleWindowClick);
            window.removeEventListener('keydown', handleKeydown);
        };
    });
</script>

{#key mobileNavOpen}
    <div
        class="mobileNav_container"
        in:fade={{ duration: 350 }}
        out:fade={{ duration: 350 }}
    >
        <div class="mobileNav_content">
            <div class="mobileNav_links">
                <button
                    type="button"
                    on:click|stopPropagation={() => goToPage('/')}
                >
                    <p>Project Details</p>
                </button>

                <button
                    type="button"
                    on:click|stopPropagation={() => goToPage('/login')}
                >
                    <p>Login</p>
                </button>
            </div>

            <a
                href="https://www.pattsway.com"
                class="mobileNav_pattsway"
                on:click|stopPropagation={closeMobileNav}
            >
                <p style="opacity: .7; font-size: 8pt;">A project by</p>
                <Logo width={"100px"} color={"#f7f7f7"} />
            </a>
        </div>
    </div>
{/key}