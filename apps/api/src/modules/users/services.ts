import { prisma } from "@/db/prisma"

export async function getUserById(userId: string) {
	return await prisma.user.findUniqueOrThrow({
		where: { id: userId },
	})
}

export async function getUserSessions(userId: string) {
	return await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		include: {
			Session: true
		}
	});
}

export async function getAllUsers() {
	return await prisma.user.findMany()
}

export async function softDelete(userId: string) {
	return await prisma.user.update({
		where: { id: userId },
		data: {
			isActive: false
		}
	})
}

