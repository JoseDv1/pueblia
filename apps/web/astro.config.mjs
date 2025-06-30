// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import alpinejs from '@astrojs/alpinejs';
import themeToggler from "./toolbar-app/integration.ts";

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), alpinejs(), themeToggler]
});