import { Hono } from "hono";
import { authRouter } from "./modules/auth/routes";


// V1
export const mainRouterV1 = new Hono()
	.route("/auth", authRouter);




