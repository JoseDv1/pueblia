import * as z from "zod/v4";

export const categoriesIdSchema = z.object({
	id: z.cuid2(),
})

export const createCategorySchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
	description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial()