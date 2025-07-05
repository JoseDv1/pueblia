import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { mainRouterV1 } from "./router";

export const server = new Hono()
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


