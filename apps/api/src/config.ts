export const PORT = process.env.PORT ?? 3000;
export const HASHING_OPTIONS = {
	algorithm: "argon2id",
	memoryCost: 65536, // 64 MB
	timeCost: 4, // 4 iterations
} satisfies Bun.Password.Argon2Algorithm;




