import type { CookieOptions } from "hono/utils/cookie";

export const PORT = Bun.env.PORT ?? 3000;
export const HASHING_OPTIONS = {
	algorithm: "argon2id",
	memoryCost: 65536, // 64 MB
	timeCost: 4, // 4 iterations
} satisfies Bun.Password.Argon2Algorithm;

// OAuth Configuration
export const GOOGLE_CLIENT_ID = Bun.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = Bun.env.GOOGLE_CLIENT_SECRET;
export const OAUTH_REDIRECT_URI = Bun.env.OAUTH_REDIRECT_URI ?? `http://localhost:${PORT}/auth/google/callback`;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
	console.warn("⚠️  Google OAuth credentials not configured. Google authentication will not be available.");
}

export const JWT_SECRET = Bun.env.JWT_SECRET
if (!JWT_SECRET) {
	console.error("❌ JWT_SECRET is not set. Please configure it in your environment variables.");
	throw new Error("JWT_SECRET is required for authentication");
}

export const JWT_ACCESS_EXPIRATION = () => Math.floor(Date.now() / 1000) + 60 * 15 // 15 minutes
export const JWT_REFRESH_EXPIRATION = () => Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days


export const COOKIES = {
	accessToken: "access_token",
	refreshToken: "refresh_token",
	oauthState: "oauth_state",
	passwordResetToken: "password_reset_token",
}

export const COOKIE_OPTIONS: CookieOptions = {
	secure: true,
	httpOnly: true,
	sameSite: "Lax",
}

export const UPLOAD_DIRECTORY = Bun.env.UPLOAD_DIRECTORY
if (!UPLOAD_DIRECTORY) {
	console.error("❌ UPLOAD_DIRECTORY is not set. Please configure it in your environment variables.");
	throw new Error("UPLOAD_DIRECTORY is required for file uploads");
}