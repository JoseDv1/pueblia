import { PORT } from "@/config"
import { server } from "@/server"

Bun.serve({
	fetch: server.fetch,
	port: PORT,
})

console.log(`🚀 Server is running at http://localhost:${PORT}/api/v1`);