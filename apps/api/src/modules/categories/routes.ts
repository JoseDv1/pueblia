import { Hono } from "hono";
import { createCategory, deleteCategory, getCategories, getCategoryById, updateCategory } from "./services";
import { zValidator } from "@/middleware/validator";
import { categoriesIdSchema, createCategorySchema, updateCategorySchema } from "./schema";
import { JWTGuard } from "@/middleware/auth";



export const categoriesRouter = new Hono()
	.get("/",
		async (ctx) => {
			return ctx.json(await getCategories(), 200);
		})
	.get("/:id",
		zValidator("param", categoriesIdSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const category = await getCategoryById(id);
			return ctx.json(category, 200);
		})
	.use(JWTGuard("ADMIN"))
	.post("/",
		zValidator("json", createCategorySchema),
		async (ctx) => {
			const data = ctx.req.valid("json");
			const category = await createCategory(data);
			return ctx.json(category, 201);
		})
	.patch("/:id",
		zValidator("param", categoriesIdSchema),
		zValidator("json", updateCategorySchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			const data = ctx.req.valid("json");
			const updatedCategory = await updateCategory(id, data);
			return ctx.json(updatedCategory, 200);
		})
	.delete("/:id",
		zValidator("param", categoriesIdSchema),
		async (ctx) => {
			const { id } = ctx.req.valid("param");
			return ctx.json(await deleteCategory(id), 200);
		})

