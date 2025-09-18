// @ts-check
import { defineConfig } from "astro/config";
import themeToggler from "../../packages/toolbar-app/integration.ts";
import alpinejs from "@astrojs/alpinejs";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
    integrations: [themeToggler, alpinejs(), svelte()],
    output: "server",
    server: {
        port: 4322,
    },
});