import type { BusinessCategory } from "@/types";
import { API_URL } from "./constants";

export interface CreateBusinessData {
	name: string;
}

export interface UpdateBusinessData {
	name?: string;
	description?: string;
	logo?: string;
	cover?: string;
	location?: string;
	website?: string;
	phone?: string;
	loyaltyPoints?: number;
	isVerified?: boolean;
	isActive?: boolean;
	openingHours?: any;
	isOpen?: boolean;
	tags?: string[];
	businessCategoryId?: string;
}

export interface Business {
	id: string;
	name: string;
	description?: string;
	logo?: string;
	cover?: string;
	location?: string;
	website?: string;
	phone?: string;
	loyaltyPoints: number;
	isVerified: boolean;
	isActive: boolean;
	openingHours?: any;
	isOpen: boolean;
	tags: string[];
	businessCategoryId?: string;
	ownerId: string;
	createdAt: string;
	updatedAt: string;
	BusinessCategory?: BusinessCategory;
}

export interface BusinessListResponse {
	businesses: Business[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}

export async function createBusiness(data: CreateBusinessData, token: string): Promise<Business> {
	const res = await fetch(`${API_URL}/api/v1/businesses`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		const error = await res.json();
		throw new Error(error.message || "Failed to create business");
	}

	return await res.json();
}

export async function getBusinesses(params?: {
	search?: string;
	category?: string;
	tags?: string;
	near?: string;
	isVerified?: boolean;
	isActive?: boolean;
	isOpen?: boolean;
	page?: number;
	limit?: number;
	sort?: string;
	order?: string;
}): Promise<BusinessListResponse> {
	const searchParams = new URLSearchParams();

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined) {
				searchParams.append(key, String(value));
			}
		});
	}

	const res = await fetch(`${API_URL}/api/v1/businesses?${searchParams}`);
	if (!res.ok) throw new Error("Failed to fetch businesses");
	return await res.json();
}

export async function getBusinessById(id: string): Promise<Business> {
	const res = await fetch(`${API_URL}/api/v1/businesses/${id}`);
	if (!res.ok) throw new Error("Failed to fetch business");
	return await res.json();
}

export async function updateBusiness(id: string, data: UpdateBusinessData, token: string): Promise<Business> {
	const res = await fetch(`${API_URL}/api/v1/businesses/${id}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		const error = await res.json();
		throw new Error(error.message || "Failed to update business");
	}

	return await res.json();
}

export async function getUserBusinesses(token: string): Promise<Business[]> {
	const res = await fetch(`${API_URL}/api/v1/businesses/me`, {
		headers: {
			"Authorization": `Bearer ${token}`
		}
	});

	if (!res.ok) {
		const error = await res.json();
		throw new Error(error.message || "Failed to fetch user businesses");
	}

	return await res.json();
}

export async function uploadBusinessCover(businessId: string, coverImage: File, token: string): Promise<{ business: Business; filePath: string }> {
	const formData = new FormData();
	formData.append('coverImage', coverImage);

	const res = await fetch(`${API_URL}/api/v1/businesses/${businessId}/cover`, {
		method: "PATCH",
		headers: {
			"Authorization": `Bearer ${token}`
		},
		body: formData
	});

	if (!res.ok) {
		const error = await res.json();
		throw new Error(error.message || "Failed to upload cover image");
	}

	return await res.json();
}