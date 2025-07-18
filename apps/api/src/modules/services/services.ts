import { prisma } from "@/db/prisma"

export async function getBussinesServices(bussinesId: string) {
	return await prisma.business.findUniqueOrThrow({
		where: { id: bussinesId },
		include: {
			Services: true
		},
	})
}