// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

declare module "*.lottie" {
    const src: string;
    export default src;
}

declare module "*.css";

declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}

export {};