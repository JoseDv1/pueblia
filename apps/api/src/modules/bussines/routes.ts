import { JWTGuard } from "@/middleware/auth";
import { zValidator } from "@/middleware/validator";
import { Hono } from "hono";
import { bussinesIdSchema, createBussinesSchema, updateBussinesSchema } from "./schema";
import { addAdminToBussines, createBussines, deleteBussines, getBussines, getBussinesById, updateBussines } from "./services";
import { HTTPException } from "hono/http-exception";
import * as z from "zod/v4";


export const bussinesRouter = new Hono()
	.post("/",
		JWTGuard(),
		zValidator("json", createBussinesSchema),
		async (ctx) => {
			const { name } = ctx.req.valid("json");
			const { sub: userId } = ctx.get("jwtPayload");
			const bussines = await createBussines({ name, ownerId: userId });
			return ctx.json(bussines, 201);
		})
	.get("/",
		async (ctx) => {
			return ctx.json(await getBussines(), 200);
		})
	.get("/:id",
		zValidator("param", bussinesIdSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const bussines = await getBussinesById(id);
			return ctx.json(bussines, 200);
		})
	.delete("/:id",
		JWTGuard(),
		zValidator("param", bussinesIdSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const { sub: userId, role } = ctx.get("jwtPayload");

			const bussines = await getBussinesById(id);
			if (!bussines)
				throw new HTTPException(404, { message: "Business not found" });

			if (bussines.ownerId !== userId && role !== "admin")
				throw new HTTPException(403, { message: "Forbidden: Only the owner or admin can delete this business" });

			await deleteBussines(id);
			return ctx.status(204);
		})
	.patch("/:id",
		JWTGuard(),
		zValidator("param", bussinesIdSchema),
		zValidator("json", updateBussinesSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const { sub: userId, role } = ctx.get("jwtPayload");
			const updateData = ctx.req.valid("json");

			const bussines = await getBussinesById(id);
			if (!bussines)
				throw new HTTPException(404, { message: "Business not found" });

			const isAdmin = role === "admin";
			const isOwner = bussines.ownerId === userId;
			const isAdminUser = bussines.AdminsUsers.some(admin => admin.id === userId);

			if (!isOwner && !isAdmin && !isAdminUser)
				throw new HTTPException(403, { message: "Forbidden: Only the owner, admin, or admin user can update this business" });



			const updatedBussines = await updateBussines(id, updateData);
			return ctx.json(updatedBussines, 200);
		}
	)
	.put("/:id",
		JWTGuard(),
		zValidator("param", bussinesIdSchema),
		zValidator("json", updateBussinesSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const { sub: userId, role } = ctx.get("jwtPayload");
			const updateData = ctx.req.valid("json");

			const bussines = await getBussinesById(id);
			if (!bussines)
				throw new HTTPException(404, { message: "Business not found" });

			const isAdmin = role === "admin";
			const isOwner = bussines.ownerId === userId;
			const isAdminUser = bussines.AdminsUsers.some(admin => admin.id === userId);

			if (!isOwner && !isAdmin && !isAdminUser)
				throw new HTTPException(403, { message: "Forbidden: Only the owner, admin, or admin user can update this business" });



			const updatedBussines = await updateBussines(id, updateData);
			return ctx.json(updatedBussines, 200);
		})
	.put("/:id/admins",
		JWTGuard(),
		zValidator("param", bussinesIdSchema),
		zValidator("json", z.object({
			userId: z.cuid2()
		})),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const { sub: userId, role } = ctx.get("jwtPayload");
			const { userId: newAdminId } = ctx.req.valid("json");

			const bussines = await getBussinesById(id);
			if (!bussines)
				throw new HTTPException(404, { message: "Business not found" });

			const isAdmin = role === "admin";
			const isOwner = bussines.ownerId === userId;
			const isAdminUser = bussines.AdminsUsers.some(admin => admin.id === userId);

			if (!isOwner && !isAdmin && !isAdminUser)
				throw new HTTPException(403, { message: "Forbidden: Only the owner, admin, or admin user can update this business" });

			const updatedBussines = await addAdminToBussines(id, newAdminId);


			return ctx.json(updatedBussines, 200);
		}
	);







