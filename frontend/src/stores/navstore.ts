import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

export const navOpen = writable(false);

// Define `navStyle` as an object with a `style` property and a `maximumWidth` boolean
export const navStyle = writable<
    { style: 'transparent' | 'dashboard' | 'standard'; capWidth: boolean; addLine: boolean;}
    >
    ({
        style: 'standard',
        capWidth: false,
        addLine: false
    });

export async function routeAndClose(route: string) {
    navOpen.set(false);
    await goto(route);
}
