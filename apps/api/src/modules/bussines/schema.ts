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

export const bussinesListQuerySchema = z.object({
	// Búsqueda
	search: z.string().optional(),

	// Filtros
	category: z.string().optional(),
	tags: z.string().optional(), // Comma-separated string of tags
	near: z.string().optional(), // Coordenadas o dirección
	isVerified: z.coerce.boolean().optional(),
	isActive: z.coerce.boolean().optional(),
	isOpen: z.coerce.boolean().optional(),

	// Paginación
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),

	// Ordenamiento
	sort: z.enum(['name', 'createdAt', 'updatedAt', 'loyaltyPoints', 'rating']).default('createdAt'),
	order: z.enum(['asc', 'desc']).default('desc'),
});
export type BussinesListQuerySchema = z.infer<typeof bussinesListQuerySchema>
