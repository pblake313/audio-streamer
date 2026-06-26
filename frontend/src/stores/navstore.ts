import { writable } from 'svelte/store';

export const navOpen = writable<boolean>(false);

export const mobileNavOpen = writable<boolean>(false)



// closing the nav
export function toggleMobileNav() {
    mobileNavOpen.update((isOpen) => !isOpen);
}
export function closeMobileNav() {
    mobileNavOpen.set(false);
}

export function openMobileNav() {
    mobileNavOpen.set(true);
}