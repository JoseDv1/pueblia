import { prisma } from "@/db/prisma";
import type * as z from "zod/v4";
import type { createCategorySchema, updateCategorySchema } from "./schema";

export async function getCategories() {
	return await prisma.businessCategory.findMany()
}

export async function getCategoryById(id: string) {
	return await prisma.businessCategory.findUniqueOrThrow({
		where: { id }
	});
}

export async function createCategory(data: z.infer<typeof createCategorySchema>) {
	return await prisma.businessCategory.create({
		data
	});
}

export async function updateCategory(id: string, data: z.infer<typeof updateCategorySchema>) {
	return await prisma.businessCategory.update({
		where: { id },
		data
	});
}

export async function deleteCategory(id: string) {
	return await prisma.businessCategory.delete({
		where: { id }
	});
}