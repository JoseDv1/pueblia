// Server-side 
import type { AstroGlobal } from "astro";

export function isAuthenticated(Astro: AstroGlobal) {
	const accessToken = Astro.cookies.get("access_token");
	const refreshToken = Astro.cookies.get("refresh_token");

	if (!accessToken && !refreshToken) return false;

	
	return true;
}