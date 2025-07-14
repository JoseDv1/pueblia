import { JWTGuard } from "@/middleware/auth";
import { Hono } from "hono";
import { getAllUsers, getUserSessions, softDelete } from "./services";
import { zValidator } from "@/middleware/validator";
import * as z from "zod/v4";
import { UserRole } from "@/db/prisma";


export const userRoutes = new Hono()
	.use(JWTGuard(UserRole.ADMIN))
	.get("/", async (ctx) => {
		const users = await getAllUsers()
		return ctx.json(users, 200)
	})
	.post("/unallow", zValidator("json", z.object({ userId: z.cuid2() })), async (ctx) => {
		const { userId } = ctx.req.valid("json")
		const blockedUser = await softDelete(userId)
		return ctx.json(blockedUser, 200)
	})
	.get("/:userId/sessions",
		zValidator("param", z.object({ userId: z.cuid2() })),
		async (ctx) => {
			const { userId } = ctx.req.valid("param");
			const { Session: sessions, ...user } = await getUserSessions(userId);
			return ctx.json({
				user,
				sessions
			}, 200);
		})