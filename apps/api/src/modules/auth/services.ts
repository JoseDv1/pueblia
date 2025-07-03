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

