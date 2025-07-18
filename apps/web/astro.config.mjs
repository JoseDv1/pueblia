// @ts-check
import { defineConfig } from "astro/config";
import themeToggler from "../../packages/toolbar-app/integration.ts";

// https://astro.build/config
export default defineConfig({
	integrations: [themeToggler],
	i18n: {
		locales: ['es', 'en'],
		defaultLocale: 'es',	
	}
});
