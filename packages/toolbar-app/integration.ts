import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

export default {
	name: 'Tooggle-Color-Scheme',
	hooks: {
		'astro:config:setup': ({ addDevToolbarApp }) => {
			addDevToolbarApp({
				id: "ToggleColorScheme",
				name: "Toggle Color Scheme",
				icon: "🎨",
				entrypoint: fileURLToPath(new URL('./app.ts', import.meta.url)),
			});
		},
	},
} satisfies AstroIntegration;