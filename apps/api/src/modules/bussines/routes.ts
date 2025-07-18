import { JWTGuard } from "@/middleware/auth";
import { zValidator } from "@/middleware/validator";
import { Hono } from "hono";
import { bussinesIdSchema, createBussinesSchema, updateBussinesSchema, bussinesListQuerySchema } from "./schema";
import { blockBussines, changeOrderStatus, createBussines, getAdminsInBussines, getBussines, getBussinesById, getBussinesByUserId, getBussinesOrders, getBussinesReviews, modifyAdminInBussines, toggleBussinesAsFav, updateBussines } from "./services";
import { HTTPException } from "hono/http-exception";
import * as z from "zod/v4";
import { OrderStatus, UserRole } from "@/db/prisma";
import { servicesRouter } from "../services/routes";

export const bussinesRouter = new Hono()
	.get("/",
		zValidator("query", bussinesListQuerySchema),
		async (ctx) => {
			const queryParams = ctx.req.valid("query");
			const result = await getBussines(queryParams);
			return ctx.json(result, 200);
		})
	.get("/:id",
		zValidator("param", bussinesIdSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const bussines = await getBussinesById(id);
			return ctx.json(bussines, 200);
		})

	.get("/:id/reviews",
		zValidator("param", bussinesIdSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const { Review: review, ...bussines } = await getBussinesReviews(id);

			return ctx.json({ bussines, reviews: review }, 200);
		})

	// ------- Favorite business routes -------
	.post("/:id/favorite",
		zValidator("param", bussinesIdSchema),
		JWTGuard(),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const { sub: userId } = ctx.get("jwtPayload");
			const bussines = await toggleBussinesAsFav(id, userId, true);
			return ctx.json(bussines, 200);
		})
	.delete("/:id/favorite",
		zValidator("param", bussinesIdSchema),
		JWTGuard(),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const { sub: userId } = ctx.get("jwtPayload");
			const bussines = await toggleBussinesAsFav(id, userId, false);
			return ctx.json(bussines, 200);
		})

	// ------- Business management routes -------
	.post("/",
		JWTGuard(),
		zValidator("json", createBussinesSchema),
		async (ctx) => {
			const { name } = ctx.req.valid("json");
			const { sub: userId } = ctx.get("jwtPayload");
			const bussines = await createBussines({ name, ownerId: userId });
			return ctx.json(bussines, 201);
		})
	.on(["PUT", "PATCH"], "/:id",
		JWTGuard(),
		zValidator("param", bussinesIdSchema),
		zValidator("json", updateBussinesSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const { sub: userId, role } = ctx.get("jwtPayload");
			const updateData = ctx.req.valid("json");

			const bussines = await getAdminsInBussines(id);
			if (!bussines)
				throw new HTTPException(404, { message: "Business not found" });

			const isAdmin = role === UserRole.ADMIN;
			const isOwner = bussines.ownerId === userId;
			const isAdminUser = bussines.AdminsUsers.some(admin => admin.id === userId);

			if (!isOwner && !isAdmin && !isAdminUser)
				throw new HTTPException(403, { message: "Forbidden: Only the owner, admin, or admin user can update this business" });



			const updatedBussines = await updateBussines(id, updateData);
			return ctx.json(updatedBussines, 200);
		}
	)
	.patch("/:id/cover", JWTGuard(), async (_ctx) => {
		// TODO: Implement cover image upload logic
		throw new HTTPException(501, { message: "Cover image upload not implemented yet" });
	})
	.get("/me", JWTGuard(), async (ctx) => {
		const { sub: userId } = ctx.get("jwtPayload");
		const bussines = await getBussinesByUserId(userId);
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

			if (bussines.ownerId !== userId && role !== UserRole.ADMIN)
				throw new HTTPException(403, { message: "Forbidden: Only the owner or admin can delete this business" });

			await blockBussines(id);
			return ctx.status(204);
		})
	// ------- Admin management routes -------
	.get("/:id/admins",
		JWTGuard(),
		zValidator("param", bussinesIdSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const admins = await getAdminsInBussines(id);
			return ctx.json(admins, 200);
		})
	.post("/:id/admins",
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

			const isAdmin = role === UserRole.ADMIN;
			const isOwner = bussines.ownerId === userId;
			const isAdminUser = bussines.AdminsUsers.some(admin => admin.id === userId);

			if (!isOwner && !isAdmin && !isAdminUser)
				throw new HTTPException(403, { message: "Forbidden: Only the owner, admin, or admin user can update this business" });

			const updatedBussines = await modifyAdminInBussines(id, newAdminId, true);


			return ctx.json(updatedBussines, 200);
		})
	.delete("/:id/admins/:userId",
		JWTGuard(),
		zValidator("param", bussinesIdSchema.extend({
			userId: z.cuid2()
		})),
		async (ctx) => {
			const { id, userId: adminId } = ctx.req.valid("param");
			const { sub: userId, role } = ctx.get("jwtPayload");

			const bussines = await getBussinesById(id);
			if (!bussines)
				throw new HTTPException(404, { message: "Business not found" });

			const isAdmin = role === UserRole.ADMIN;
			const isOwner = bussines.ownerId === userId;
			const isAdminUser = bussines.AdminsUsers.some(admin => admin.id === userId);

			if (!isOwner && !isAdmin && !isAdminUser)
				throw new HTTPException(403, { message: "Forbidden: Only the owner, admin, or admin user can update this business" });

			if (bussines.ownerId === adminId)
				throw new HTTPException(400, { message: "Cannot remove the owner from the business" });

			const updatedBussines = await modifyAdminInBussines(id, adminId, false);

			return ctx.json(updatedBussines, 200);
		})
	// ----  Services/Offers management routes ----
	.route("/", servicesRouter)
	// ------- Orders management routes -------
	.get("/:id/orders",
		JWTGuard(),
		zValidator("param", bussinesIdSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const { sub: userId, role } = ctx.get("jwtPayload");
			const bussines = await getAdminsInBussines(id);
			if (!bussines)
				throw new HTTPException(404, { message: "Business not found" });
			const isAdmin = role === UserRole.ADMIN;
			const isOwner = bussines.ownerId === userId;
			const isAdminUser = bussines.AdminsUsers.some(admin => admin.id === userId);

			if (!isOwner && !isAdmin && !isAdminUser)
				throw new HTTPException(403, { message: "Forbidden: Only the owner, admin, or admin user can view orders for this business" });

			const orders = await getBussinesOrders(id);
			return ctx.json(orders, 200);
		})
	.patch("/:id/orders/:orderId/status",
		JWTGuard(),
		zValidator("param", bussinesIdSchema.extend({
			orderId: z.string().cuid2()
		})),
		zValidator("json", z.object({
			status: z.enum(OrderStatus)
		})),
		async (ctx) => {
			const { id, orderId } = ctx.req.valid("param");
			const { sub: userId, role } = ctx.get("jwtPayload");
			const { status } = ctx.req.valid("json");

			const bussines = await getAdminsInBussines(id);
			if (!bussines)
				throw new HTTPException(404, { message: "Business not found" });

			const isAdmin = role === UserRole.ADMIN;
			const isOwner = bussines.ownerId === userId;
			const isAdminUser = bussines.AdminsUsers.some(admin => admin.id === userId);

			if (!isOwner && !isAdmin && !isAdminUser)
				throw new HTTPException(403, { message: "Forbidden: Only the owner, admin, or admin user can update orders for this business" });

			const updatedOrder = await changeOrderStatus(orderId, status);
			return ctx.json(updatedOrder, 200);

		})
	// TODO: Implement Commisions
	// TODO: Implement Chat management routes
	// TODO: Implement Notifications 
	// -------- ADMIN ROLE ROUTES --------

	.use(JWTGuard(UserRole.ADMIN))
	.post("/:id/block",
		zValidator("param", bussinesIdSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const blockedBussines = await blockBussines(id);
			return ctx.json(blockedBussines, 200);
		})
// TODO: /admin/businesses/:id/approve 
// TODO: /businesses/:id/analytics








