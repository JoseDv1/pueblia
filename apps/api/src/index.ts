import { PORT } from "@/config"
import { server } from "@/server"

Bun.serve({
	fetch: server.fetch,
	port: PORT,
})