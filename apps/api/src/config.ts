export const PORT = process.env.PORT ?? 3000;

export const HASHING_OPTIONS = {
	algorithm: "argon2id",
	memoryCost: 65536, // 64 MB
	timeCost: 4, // 4 iterations
} satisfies Bun.Password.Argon2Algorithm;

// OAuth Configuration
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI ?? `http://localhost:${PORT}/auth/google/callback`;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
	console.warn("⚠️  Google OAuth credentials not configured. Google authentication will not be available.");
}




