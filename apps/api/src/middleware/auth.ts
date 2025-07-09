import { COOKIES, JWT_SECRET } from "@/config";
import { createMiddleware } from "hono/factory";
import { jwt } from "hono/jwt";
import type { UserRole } from "../../../../packages/db/generated/prisma/enums";
import { HTTPException } from "hono/http-exception";
import type { MiddlewareHandler } from "hono";

const authMiddleware = jwt({
	secret: JWT_SECRET!,
	cookie: {
		key: COOKIES.accessToken,
	}
})

export const JWTGuard = (allowRoles?: UserRole[] | UserRole): MiddlewareHandler => {
	return createMiddleware(async (c, next) => {
		await authMiddleware(c, async () => {
			const payload = c.get('jwtPayload');

			if (!payload || !payload.role) {
				throw new HTTPException(401, { message: "Unauthorized: No role found" });
			}

			if (!allowRoles) {
				return await next()
			}

			const rolesArray = Array.isArray(allowRoles) ? allowRoles : [allowRoles];
			if (!rolesArray.includes(payload.role)) {
				throw new HTTPException(403, { message: "Forbidden: Insufficient permissions" });
			}

			// Solo llamar next() una vez, al final del proceso
			return await next();
		});
	});
}

