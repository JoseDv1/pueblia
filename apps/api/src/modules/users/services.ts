import { prisma } from "@/db/prisma"

export async function getUserById(userId: string) {
	return await prisma.user.findUniqueOrThrow({
		where: { id: userId },
	})
}