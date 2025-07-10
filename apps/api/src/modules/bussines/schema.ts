import * as z from "zod/v4"


export const createBussinesSchema = z.object({
	name: z.string(),
})
export type CreateBussinesSchema = z.infer<typeof createBussinesSchema>

export const bussinesIdSchema = z.object({
	id: z.cuid2()
});

export const updateBussinesSchema = z.object({
	name: z.string(),
	description: z.string(),
	logo: z.string().url(),
	cover: z.string().url(),
	location: z.string().url(),
	website: z.string().url(),
	phone: z.string(),
	loyaltyPoints: z.number().int().min(0),
	isVerified: z.boolean(),
	isActive: z.boolean(),
	openingHours: z.any(),
	isOpen: z.boolean(),
	tags: z.array(z.string()),
	businessCategoryId: z.string(),
}).partial();
export type UpdateBussinesSchema = z.infer<typeof updateBussinesSchema>
