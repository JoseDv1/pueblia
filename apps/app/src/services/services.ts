import type { Services } from "@/types"
import { API_URL } from "./constants"

export async function getServices(): Promise<Services[]> {
	const res = await fetch(`${API_URL}/api/v1/services`)
	if (!res.ok) throw new Error("Failed to fetch services")
	return await res.json()
}

