import { prisma } from "@/db/prisma";
import type { CreateBussinesSchema, UpdateBussinesSchema } from "./schema";

export type CreateBussinesData = Omit<CreateBussinesSchema, "ownerId"> & { ownerId: string };
export async function createBussines(data: CreateBussinesData) {
	return await prisma.business.create({ data })
}

export async function getBussines() {
	return await prisma.business.findMany();
}

export async function getBussinesById(id: string) {
	return await prisma.business.findUniqueOrThrow({
		where: { id },
		include: {
			AdminsUsers: true
		}
	});
}

export async function deleteBussines(id: string) {
	return await prisma.business.delete({
		where: { id }
	});
}

export async function updateBussines(id: string, data: UpdateBussinesSchema) {
	return await prisma.business.update({
		where: { id },
		data
	});
}

export async function addAdminToBussines(bussinesId: string, userId: string) {
	return await prisma.business.update({
		where: { id: bussinesId },
		data: {
			AdminsUsers: {
				connect: { id: userId }
			}
		}
	});
}