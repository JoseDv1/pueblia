// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import alpinejs from '@astrojs/alpinejs';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), alpinejs()]
});