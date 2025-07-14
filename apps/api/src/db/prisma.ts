import { PrismaClient } from "../../../../packages/db/generated/prisma/client";

export const prisma = new PrismaClient({
	omit: {
		user: {
			hashedPassword: true, // Omit hashedPassword field by default
		}
	}
})

export type { BusinessWhereInput, BusinessOrderByWithRelationInput } from "../../../../packages/db/generated/prisma/models"
export { UserRole, OrderStatus } from "../../../../packages/db/generated/prisma/enums"
