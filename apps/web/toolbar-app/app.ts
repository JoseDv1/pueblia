import { defineToolbarApp } from "astro/toolbar";

export default defineToolbarApp({
	init(canvas, app) {
		const root = document.documentElement
		const documentTheme = document.documentElement.style.colorScheme;
		console.log("Document theme:", documentTheme);
		if (documentTheme === "light dark") {
			root.style.colorScheme = "dark";
		}

		app.onToggled(() => {
			if (root.style.colorScheme === "dark") {
				root.style.colorScheme = "light";
			} else {
				root.style.colorScheme = "dark";
			}
		})
	},
});