"use server"
import type { AstroGlobal } from "astro";
import type { JWTPayload } from "jose";
import { jwtVerify } from "jose/jwt/verify";
const JWT_SECRET = import.meta.env.JWT_SECRET
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

export async function isAuthenticated(Astro: AstroGlobal): Promise<JWTPayload | null> {
	try {
		const accessToken = Astro.cookies.get("access_token")?.value;
		const refreshToken = Astro.cookies.get("refresh_token")?.value;

		if (!accessToken || !refreshToken)
			throw new Error("Missing tokens");

		const { payload } = await jwtVerify(accessToken,
			new TextEncoder().encode(JWT_SECRET));

		return payload;
	} catch (error) {
		console.error("Error verifying JWT:", error);
		return null;
	}
}
