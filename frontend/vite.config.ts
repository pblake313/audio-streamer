import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [sveltekit()],
    assetsInclude: ["**/*.lottie"],
    server: {
        watch: {
            // build output isn't source; watching it crashes dev on Windows
            // (EBUSY) when a build rewrites large files like the videos
            ignored: ["**/build/**"],
        },
    },
});