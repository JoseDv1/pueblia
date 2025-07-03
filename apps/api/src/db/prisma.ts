import { PrismaClient } from "../../../../packages/db/generated/prisma/client";

export const prisma = new PrismaClient({
	omit: {
		user: {
			hashedPassword: true, // Omit hashedPassword field by default
		}
	}
})