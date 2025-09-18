import { prisma } from "@/db/prisma"

export async function getBussinesServices(bussinesId: string) {
	return await prisma.business.findUniqueOrThrow({
		where: { id: bussinesId },
		include: {
			Services: true
		},
	})
}

export async function getAllServices(page: number = 1, pageSize: number = 50) {
	const limit = pageSize > 100 ? 100 : pageSize;
	const offset = (page - 1) * limit;

	const total = await prisma.services.count();
	const totalPages = Math.ceil(total / limit);

	const services = await prisma.services.findMany({
		skip: offset,
		take: limit,
		orderBy: { createdAt: "desc" }
	});

	return {
		services,
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1
		}
	};
}