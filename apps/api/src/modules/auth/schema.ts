import * as z from "zod/v4";

export const authLoginSchema = z.object({
	email: z.email(),
	password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const authRegisterSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email(),
	password: z.string().min(6, "Password must be at least 6 characters long"),
	confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters long"),
	displayName: z.string().optional(),
})

export const authGoogleCallbackSchema = z.object({
	code: z.string(),
	state: z.string(),
	error: z.string().optional(),
});
