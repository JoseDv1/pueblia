// @ts-check
import { defineConfig } from "astro/config";
import themeToggler from "../../packages/toolbar-app/integration.ts";

import alpinejs from "@astrojs/alpinejs";

// https://astro.build/config
export default defineConfig({
	integrations: [themeToggler, alpinejs()],

	server: {
		port: 4322,
	},
});
