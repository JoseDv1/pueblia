import { Hono } from "hono";
import { authRouter } from "./modules/auth/routes";
import { userRoutes } from "./modules/users/routes";
import { bussinesRouter } from "./modules/bussines/routes";
import { categoriesRouter } from "./modules/categories/routes";


// V1
export const mainRouterV1 = new Hono()
	.route("/auth", authRouter)
	.route("/users", userRoutes)
	.route("/bussiness", bussinesRouter)
	.route("/categories", categoriesRouter)




