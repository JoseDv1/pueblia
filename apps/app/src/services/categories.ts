import type { BusinessCategory } from "@/types";
import { API_URL } from "./constants";

export async function getCategories(): Promise<BusinessCategory[]> {
	const res = await fetch(`${API_URL}/api/v1/categories`);
	if (!res.ok) throw new Error("Failed to fetch categories");
	return await res.json();
}

