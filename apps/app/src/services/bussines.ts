import type { AstroGlobal } from "astro"
import { API_URL } from "./constants"

export async function getMyBussines(Astro: AstroGlobal) {
	const res = await fetch(`${API_URL}/api/v1/bussines/me`, {
		credentials: "include",
		headers: {
			'Cookie': Astro.request.headers.get('cookie') || ''
		}
	})

	if (!res.ok) throw new Error("Failed to fetch bussines by owner ID")
	return await res.json()
}