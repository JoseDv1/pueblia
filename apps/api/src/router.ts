import { Hono } from "hono";
import { authRouter } from "./modules/auth/routes";
import { userRoutes } from "./modules/users/routes";
import { bussinesRouter } from "./modules/bussines/routes";
import { categoriesRouter } from "./modules/categories/routes";
import { servicesRouter } from "./modules/services/routes";


// V1
export const mainRouterV1 = new Hono()
	.route("/auth", authRouter)
	.route("/users", userRoutes)
	.route("/bussines", bussinesRouter)
	.route("/categories", categoriesRouter)
	.route("/services", servicesRouter)




