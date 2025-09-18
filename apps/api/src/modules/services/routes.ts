import { Hono } from "hono";
import { zValidator } from "@/middleware/validator";
import * as z from "zod/v4";
import { getAllServices, getBussinesServices } from "./services";


export const servicesRouter = new Hono()
	.get("/", async (ctx) => {
		const services = await getAllServices();
		return ctx.json(services, 200);
	})


export const bussinesServicesRouter = new Hono()
	.basePath("/:bussinesId/services")
	.get("/", zValidator("param", z.object({
		bussinesId: z.cuid2()
	})), async (ctx) => {
		const { bussinesId } = ctx.req.valid("param")
		const services = await getBussinesServices(bussinesId);
		return ctx.json(services, 200);
	})




