import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import { mainRouterV1 } from "./router";
import { logger } from "hono/logger";

export const server = new Hono()
	.use(logger()) // Use the logger middleware for development
	.use(cors({
		origin: ["http://localhost:4322", "http://127.0.0.1:4322"],
		credentials: true
	}))
	.route("/api/v1", mainRouterV1)

server.onError((error, ctx) => {
	// Log the error details for debugging
	console.log("Server error:", error);
	if (error instanceof HTTPException) {
		if (error.res) {
			return error.res;
		}
		return ctx.json({ error: error.message }, error.status);

	}

	// Return a generic error response
	return ctx.json({ error: "Internal Server Error" }, 500);
})


