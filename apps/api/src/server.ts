import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

export const server = new Hono();

server.onError((error, ctx) => {
	// Log the error details for debugging
	console.error("Server error:", error);
	if (error instanceof HTTPException) {
		return ctx.json({ error: error.message }, error.status);
	}

	// Return a generic error response
	return ctx.json({ error: "Internal Server Error" }, 500);
})


