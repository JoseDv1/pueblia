import { Hono } from "hono";
import { zValidator } from "@/middleware/validator";
import { authLoginSchema, authRegisterSchema } from "./schema";
import { login, register } from "./services"
import { HTTPException } from "hono/http-exception";

export const authRouter = new Hono()
	.post("/login", zValidator("json", authLoginSchema), async (ctx) => {
		const { email, password } = ctx.req.valid("json")
		const user = await login(email, password);
		return ctx.json({ user }, 200);
	})
	.post("/register", zValidator("json", authRegisterSchema), async (ctx) => {
		const { email, password, confirmPassword, name, displayName } = ctx.req.valid("json");
		const user = await register(email, password, confirmPassword, name, displayName);
		return ctx.json({ user }, 201);
	})
	.get("/google", () => {
		throw new HTTPException(501, { message: "Google authentication not implemented yet" });
	})
