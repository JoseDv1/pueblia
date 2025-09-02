import { OrderStatus, prisma, type BusinessWhereInput } from "@/db/prisma";
import type { CreateBussinesSchema, UpdateBussinesSchema, BussinesListQuerySchema } from "./schema";


export type CreateBussinesData = Omit<CreateBussinesSchema, "ownerId"> & { ownerId: string };

export async function createBussines(data: CreateBussinesData) {
	return await prisma.business.create({ data })
}

export async function getBussines(filters?: BussinesListQuerySchema) {
	if (!filters) {
		return await prisma.business.findMany();
	}

	const {
		search,
		category,
		tags,
		near: _near, // TODO: Implementar filtro de geolocalización
		isVerified,
		isActive,
		isOpen,
		page,
		limit,
		sort: _sort, // TODO: Implementar ordenamiento por rating
		order: _order
	} = filters;

	// Construir filtros WHERE
	const where: BusinessWhereInput = {};

	// Filtro de búsqueda en nombre y descripción
	if (search) where.OR = [
		{ name: { contains: search, mode: 'insensitive' } },
		{ description: { contains: search, mode: 'insensitive' } }
	];

	// Filtro por categoría
	if (category) where.businessCategoryId = category;

	// Filtro por tags
	if (tags) {
		const tagArray = tags.split(',').map(tag => tag.trim());
		where.tags = {
			hasSome: tagArray
		};
	}
	// Filtros booleanos
	if (isVerified) where.isVerified = isVerified;
	if (isActive) where.isActive = isActive;
	if (isOpen !== undefined) where.isOpen = isOpen;

	// TODO: Implementar filtro por ubicación 'near' cuando se tenga geolocalización
	// Esto requeriría coordenadas y cálculo de distancia

	// Construir ordenamiento
	// TODO: Implementar ordenamiento por rating

	// Calcular offset para paginación
	const skip = (page - 1) * limit;

	// Ejecutar consulta con paginación
	const businessesQuery = prisma.business.findMany({
		where,
		skip,
		take: limit,
		include: {
			BusinessCategory: {
				select: {
					id: true,
					name: true
				}
			},
			Review: {
				select: {
					rating: true
				}
			},
			_count: {
				select: {
					Review: true,
					Favorite: true
				}
			}
		}
	})
	const countQuery = prisma.business.count({ where });
	const [businesses, total] = await prisma.$transaction([businessesQuery, countQuery]);

	// Calcular información de paginación
	const totalPages = Math.ceil(total / limit);
	const hasNextPage = page < totalPages;
	const hasPrevPage = page > 1;

	return {
		businesses: businesses,
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNextPage,
			hasPrevPage
		}
	};
}

export async function getBussinesByUserId(userId: string) {
	return await prisma.business.findMany({
		where: { OR: [{ ownerId: userId }, { AdminsUsers: { some: { id: userId } } }] },
		include: {
			AdminsUsers: true
		}
	});

}

export async function getBussinesById(id: string) {
	return await prisma.business.findUniqueOrThrow({
		where: { id },
		include: {
			AdminsUsers: true
		}
	});
}

export async function getAdminsInBussines(bussinesId: string) {
	return await prisma.business.findUniqueOrThrow({
		where: { id: bussinesId },
		include: {
			AdminsUsers: {
				select: {
					id: true,
					displayName: true,
					image: true
				}
			}
		}
	});
}

export async function blockBussines(id: string) {
	return await prisma.business.update({
		where: { id },
		data: { isActive: false }
	});
}


export async function updateBussines(id: string, data: UpdateBussinesSchema) {
	return await prisma.business.update({
		where: { id },
		data
	});
}

export async function modifyAdminInBussines(bussinesId: string, userId: string, add: boolean = true) {
	return await prisma.business.update({
		where: { id: bussinesId },
		data: {
			AdminsUsers: {
				[add ? "connect" : "disconnect"]: { id: userId }
			}
		}
	});
}


export async function getBussinesReviews(bussinesId: string) {
	return await prisma.business.findUniqueOrThrow({
		where: { id: bussinesId },
		include: {
			Review: {
				include: {
					User: {
						select: {
							displayName: true,
							image: true,
						}
					}
				}
			}
		}
	})
}

export async function toggleBussinesAsFav(bussinesId: string, userId: string, add: boolean) {
	const action = add ? "connect" : "disconnect";
	return await prisma.business.update({
		where: { id: bussinesId },
		data: {
			Favorite: {
				[action]: { id: userId }
			}
		},
		include: {
			Favorite: true
		}
	});
}

export async function updateBussinesCoverImage(bussinesId: string, imagePath: string) {
	return await prisma.business.update({
		where: { id: bussinesId },
		data: {
			cover: imagePath
		}
	});
}

export async function uploadBussinesCoverImage(bussinesId: string, coverImage: File) {
	// Validate media type
	if (!coverImage || !["image/jpeg", "image/png", "image/webp"].includes(coverImage.type)) {
		throw new Error("Invalid cover image. Only JPEG, PNG, and webp formats are allowed.");
	}

	// Create a folder for the cover images if it doesn't exist
	const bussinesUploadDir = `${Bun.env.UPLOAD_DIRECTORY}/${bussinesId}`;
	const fileNewName = `cover_${Date.now()}_${coverImage.name}`;
	const filePath = `${bussinesUploadDir}/${fileNewName}.${coverImage.type.split("/")[1]}`;

	// Save the file to the server
	await Bun.write(filePath, await coverImage.arrayBuffer(), {
		createPath: true,
	});

	// Update the business record with the new cover image URL/path
	const updatedBusiness = await updateBussinesCoverImage(bussinesId, filePath);

	return {
		business: updatedBusiness,
		filePath
	};
}


// ----------- Orders -----------
export async function getBussinesOrders(bussinesId: string) {
	return await prisma.business.findUniqueOrThrow({
		where: { id: bussinesId },
		include: {
			Orders: {
				include: {
					user: {
						select: {
							id: true,
							displayName: true,
							image: true
						}
					}
				}
			}
		}
	});
}

export async function changeOrderStatus(orderId: string, status: OrderStatus) {
	return await prisma.orders.update({
		where: { id: orderId },
		data: { status }
	});
}