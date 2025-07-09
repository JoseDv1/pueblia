import * as z from "zod/v4"

const createBussinesSchema = z.object({
	name: z.string(),
	ownerId: z.cuid2(),
})