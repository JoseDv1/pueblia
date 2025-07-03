import { HASHING_OPTIONS } from "@/config";
import { prisma } from "@/db/prisma";
import { HTTPException } from "hono/http-exception";

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

