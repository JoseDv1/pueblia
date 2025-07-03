import { COOKIES, HASHING_OPTIONS, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION, JWT_SECRET } from "@/config";
import { prisma } from "@/db/prisma";
import { HTTPException } from "hono/http-exception";
import type { $Enums } from "../../../../../packages/db/generated/prisma/client";
import * as jwt from "hono/jwt";
import type { Context } from "hono";
import { setCookie } from "hono/cookie";

export async function createTokens(userId: string, role: $Enums.UserRole) {
	const payload = {
		sub: userId,
		role,
		iat: Math.floor(Date.now() / 1000), // issued at
	}
	const accessToken = await jwt.sign({ ...payload, exp: JWT_ACCESS_EXPIRATION() }, JWT_SECRET!)
	const refreshToken = await jwt.sign({ ...payload, exp: JWT_ACCESS_EXPIRATION() + 60 * 60 * 24 * 7 }, JWT_SECRET!)

	// Store refresh token in the database for later validation
	await prisma.sessionToken.create({
		data: {
			userId,
			sessionToken: refreshToken,
			expiresAt: new Date(JWT_REFRESH_EXPIRATION() * 1000),
			// Optionally store the IP address and user agent if needed
		}
	});

	return {
		accessToken,
		refreshToken,
	};
}

export async function login(email: string, password: string) {
	const user = await prisma.user.findUniqueOrThrow({
		where: { email },
		omit: {
			hashedPassword: false
		},
	});

	if (!user.hashedPassword) {
		throw new HTTPException(400, { message: "User does not have a password set" });
	}
	const isValidPassword = await Bun.password.verify(password, user.hashedPassword, HASHING_OPTIONS.algorithm);
	if (!isValidPassword) {
		throw new HTTPException(401, { message: "Invalid email or password" });
	}

	await prisma.user.update({
		where: { id: user.id },
		data: {
			lastLoginAt: new Date(),
		}
	});

	return {
		...user,
		hashedPassword: undefined,
	};

}

export async function register(email: string, password: string, confirmPassword: string, name?: string, displayName?: string) {
	if (password !== confirmPassword) {
		throw new Error("Passwords do not match");
	}
	const hashedPassword = await Bun.password.hash(password, HASHING_OPTIONS);
	const user = await prisma.user.create({
		data: {
			email,
			hashedPassword,
			name,
			displayName,
		},
		omit: {
			hashedPassword: false
		}
	});

	return {
		...user,
		hashedPassword: undefined,
	};
}
export async function findOrCreateGoogleUser(googleProfile: {
	id: string;
	email: string;
	name?: string;
	picture?: string;
}) {
	// Buscar si ya existe una cuenta OAuth para este usuario
	const account = await prisma.account.findUnique({
		where: {
			provider_providerAccountId: {
				provider: "GOOGLE",
				providerAccountId: googleProfile.id,
			},
		},
		include: {
			user: true,
		},
	});

	// Usuario ya existe, actualizar último login
	if (account) {
		const user = await prisma.user.update({
			where: { id: account.userId },
			data: { lastLoginAt: new Date() },
		});
		return user;
	}

	// Verificar si ya existe un usuario con este email
	let user = await prisma.user.findUniqueOrThrow({
		where: { email: googleProfile.email },
	});

	if (!user) {
		// Si no existe, crear un nuevo usuario
		user = await prisma.user.create({
			data: {
				email: googleProfile.email,
				name: googleProfile.name,
				displayName: googleProfile.name,
				image: googleProfile.picture,
				emailVerified: true, // Google emails are already verified
				lastLoginAt: new Date(),
			},
		});
	}

	// Crear cuenta OAuth asociada
	await prisma.account.create({
		data: {
			userId: user.id,
			provider: "GOOGLE",
			providerAccountId: googleProfile.id,
		},
	});

	return user;
}

export async function refreshToken(refreshTokenValue: string) {
	// Verificar que el token no esté en la blacklist
	const blacklistedToken = await prisma.tokenBlacklist.findUnique({
		where: { sessionToken: refreshTokenValue },
	});
	if (blacklistedToken) throw new HTTPException(401, { message: "Token is blacklisted" });

	// Verificar, validar y decodificar el refresh token
	const payload = await jwt.verify(refreshTokenValue, JWT_SECRET!);
	if (!payload.sub || !payload.role) throw new HTTPException(401, { message: "Invalid token payload" });
	const sessionToken = await prisma.sessionToken.findUniqueOrThrow({
		where: { sessionToken: refreshTokenValue },
		include: { user: true },
	});

	if (sessionToken.expiresAt < new Date()) {
		// Token expirado, eliminarlo de la base de datos
		await prisma.sessionToken.delete({
			where: { id: sessionToken.id },
		});
		throw new HTTPException(401, { message: "Refresh token expired" });
	}

	if (!sessionToken.user.isActive) throw new HTTPException(401, { message: "User account is inactive" });

	// Crear nuevos tokens
	const { accessToken, refreshToken: newRefreshToken } = await createTokens(
		sessionToken.user.id,
		sessionToken.user.role
	);

	// Invalidar el refresh token anterior
	await prisma.sessionToken.delete({
		where: { id: sessionToken.id },
	});

	return {
		accessToken,
		refreshToken: newRefreshToken,
	};

}

export async function blacklistToken(refreshTokenValue: string, userId: string) {
	// Añadir el token a la blacklist
	await prisma.tokenBlacklist.create({
		data: {
			sessionToken: refreshTokenValue,
			userId,
		},
	});

	// Eliminar el token de la tabla de sesiones activas
	await prisma.sessionToken.deleteMany({
		where: { sessionToken: refreshTokenValue },
	});
}

export async function logout(token: string) {
	const payload = await jwt.verify(token, JWT_SECRET!);
	if (!payload.sub) {
		throw new HTTPException(401, { message: "Invalid token payload" });
	}
	await prisma.sessionToken.delete({
		where: { sessionToken: token, userId: payload.sub },
	});
}

export async function setAuthCookies(ctx: Context, { accessToken, refreshToken }: { accessToken: string; refreshToken: string }) {
	setCookie(ctx, COOKIES.accessToken, accessToken, { httpOnly: true, sameSite: "Lax", maxAge: JWT_ACCESS_EXPIRATION() - Math.floor(Date.now() / 1000), path: "/" });
	setCookie(ctx, COOKIES.refreshToken, refreshToken, { httpOnly: true, sameSite: "Lax", maxAge: JWT_REFRESH_EXPIRATION() - Math.floor(Date.now() / 1000), path: "/" });
}