import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie"
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@/middleware/validator";
import { JWTGuard } from "@/middleware/auth";
import { COOKIES, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI } from "@/config";
import * as z from "zod/v4";
import { authGoogleCallbackSchema, authLoginSchema, authRegisterSchema } from "./schema";
import { login, register, findOrCreateGoogleUser, createTokens, refreshToken as refreshTokenService, logout, setAuthCookies, createPasswordResetToken, resetPassword, changePassword, revokeSession } from "./services"
import { getUserById, getUserSessions } from "../users/services";

export const authRouter = new Hono()
	.post("/register",
		zValidator("json", authRegisterSchema),
		async (ctx) => {
			const { email, password, confirmPassword, name, displayName } = ctx.req.valid("json");
			const user = await register(email, password, confirmPassword, name, displayName);
			// Send a welcome email or email verification link
			// TODO: Implement email sending logic here to notify the user and verify their email

			// Create and set JWT tokens
			const tokens = await createTokens(user.id, user.role);
			await setAuthCookies(ctx, tokens);
			return ctx.json({ user }, 201);
		})
	.post("/login",
		zValidator("json", authLoginSchema),
		async (ctx) => {
			const { email, password } = ctx.req.valid("json")
			const user = await login(email, password);
			const tokens = await createTokens(user.id, user.role);
			await setAuthCookies(ctx, tokens);
			return ctx.json({ user }, 200);
		})
	.post("/refresh",
		async (ctx) => {
			const refreshTokenValue = getCookie(ctx, COOKIES.refreshToken);
			if (!refreshTokenValue) throw new HTTPException(401, { message: "Refresh token not provided" });
			try {
				const { accessToken, refreshToken } = await refreshTokenService(refreshTokenValue);
				await setAuthCookies(ctx, { accessToken, refreshToken });
				return ctx.json({
					message: "Tokens refreshed successfully",
				}, 200);
			} catch (error) {
				// Si hay error, limpiar las cookies
				deleteCookie(ctx, COOKIES.accessToken);
				deleteCookie(ctx, COOKIES.refreshToken);
				if (error instanceof HTTPException) {
					throw error;
				}
				throw new HTTPException(500, { message: "Failed to refresh token" });
			}
		})
	.post("/logout",
		JWTGuard(),
		async (ctx) => {
			const { sub: userId } = ctx.get("jwtPayload");
			const token = getCookie(ctx, COOKIES.refreshToken);
			if (!token) throw new HTTPException(400, { message: "Missing refresh token" });
			await logout(userId, token);
			deleteCookie(ctx, COOKIES.accessToken);
			deleteCookie(ctx, COOKIES.refreshToken);
			return ctx.json({ message: "Logged out successfully" }, 200);
		})
	.post("/logout/all",
		JWTGuard(),
		async (ctx) => {
			const { sub: userId } = ctx.get("jwtPayload");
			const token = getCookie(ctx, COOKIES.refreshToken);
			if (!token) throw new HTTPException(400, { message: "Missing refresh token" });
			await logout(userId, token, true);
			deleteCookie(ctx, COOKIES.accessToken);
			deleteCookie(ctx, COOKIES.refreshToken);
			return ctx.json({ message: "Logged out from all devices successfully" }, 200);
		})
	.get("/email/verify",
		zValidator("query", z.object({ token: z.jwt() })),
		async (ctx) => {
			const { token: _ } = ctx.req.valid("query");
			return ctx.json({ message: "Email verified successfully" }, 200);
		})
	.post("/email/resend",
		zValidator("json", z.object({ email: z.string().email() })),
		async (ctx) => {
			const { email: _ } = ctx.req.valid("json");
			// TODO: Implement email resending logic
			return ctx.json({ message: "Verification email resent successfully" }, 200);
		})
	.post("/password/forgot",
		zValidator("json", z.object({ email: z.email() })),
		async (ctx) => {
			const { email } = ctx.req.valid("json");
			const createdToken = await createPasswordResetToken(email);
			if (!createdToken) throw new HTTPException(404, { message: "User not found" });
			// TODO: Send email with reset link
			return ctx.json({ message: "Password reset link sent to your email" }, 200);
		})
	.post("/password/reset",
		zValidator("json", z.object({
			token: z.string(),
			newPassword: z.string().min(8),
			confirmPassword: z.string().min(8)
		}).refine((data) => data.newPassword === data.confirmPassword, {
			message: "Passwords do not match",
			path: ["confirmPassword"],
		})),
		async (ctx) => {
			const { token, newPassword } = ctx.req.valid("json");
			await resetPassword(token, newPassword);
			return ctx.json({ message: "Password reset successfully" }, 200);
		})
	.post("/password/change",
		JWTGuard(),
		zValidator("json", z.object({
			currentPassword: z.string().min(8),
			newPassword: z.string().min(8),
			confirmPassword: z.string().min(8)
		}).refine((data) => data.newPassword === data.confirmPassword, {
			message: "Passwords do not match"
		}).refine((data) => data.currentPassword !== data.newPassword, {
			message: "New password must be different from current password"
		})), async (ctx) => {
			const { sub: userId } = ctx.get("jwtPayload");
			const { currentPassword, newPassword } = ctx.req.valid("json");
			await changePassword(userId, currentPassword, newPassword);
			return ctx.json({ message: "Password changed successfully" }, 200);
		})
	.get("/sessions",
		JWTGuard(),
		async (ctx) => {
			const { sub: userId } = ctx.get("jwtPayload");
			const { Session: sessions, ...user } = await getUserSessions(userId);
			return ctx.json({
				user,
				sessions
			}, 200)
		})
	.delete("/sessions/:sessionId",
		zValidator("param", z.object({ sessionId: z.cuid2() })),
		JWTGuard(),
		async (ctx) => {
			const { sub: userId } = ctx.get("jwtPayload");
			const { sessionId } = ctx.req.valid("param");
			await revokeSession(sessionId, userId);
			return ctx.json({ message: "Session deleted successfully" }, 200);
		})
	// Google OAuth routes
	.get("/oauth/google",
		(ctx) => {
			if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) throw new HTTPException(500, { message: "Google OAuth not configured" });

			const state = crypto.randomUUID();

			// Store state in session/cookie for verification later
			setCookie(ctx, COOKIES.oauthState, state, { httpOnly: true, sameSite: "Lax", maxAge: 600, path: "/" });
			const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

			googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
			googleAuthUrl.searchParams.set("redirect_uri", OAUTH_REDIRECT_URI);
			googleAuthUrl.searchParams.set("response_type", "code");
			googleAuthUrl.searchParams.set("scope", "openid email profile");
			googleAuthUrl.searchParams.set("state", state);

			return ctx.redirect(googleAuthUrl.toString());
		})
	.get("/google/callback",
		zValidator("query", authGoogleCallbackSchema),
		async (ctx) => {
			if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) throw new HTTPException(500, { message: "Google OAuth not configured" });
			const { code, state, error } = ctx.req.valid("query");
			if (error) throw new HTTPException(400, { message: `OAuth error: ${error}` });
			const stateCookie = getCookie(ctx, COOKIES.oauthState);
			if (!stateCookie) throw new HTTPException(400, { message: "Missing state cookie" });
			if (state !== stateCookie) throw new HTTPException(400, { message: "Invalid state parameter" });

			try {
				const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						client_id: GOOGLE_CLIENT_ID,
						client_secret: GOOGLE_CLIENT_SECRET,
						code,
						grant_type: "authorization_code",
						redirect_uri: OAUTH_REDIRECT_URI,
					}),
				});
				if (!tokenResponse.ok) throw new HTTPException(400, { message: "Failed to exchange code for token" });
				const tokenData = await tokenResponse.json();
				const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
					headers: {
						Authorization: `Bearer ${tokenData.access_token}`,
					},
				});
				if (!userResponse.ok) throw new HTTPException(400, { message: "Failed to get user info from Google" });

				const googleUser = await userResponse.json();
				const user = await findOrCreateGoogleUser({
					id: googleUser.id,
					email: googleUser.email,
					name: googleUser.name,
					picture: googleUser.picture,
				});

				// Clear state cookie
				deleteCookie(ctx, COOKIES.oauthState);

				// Create and set JWT tokens
				const tokens = await createTokens(user.id, user.role);
				await setAuthCookies(ctx, tokens);

				// Return user data or redirect to frontend with token
				return ctx.json({
					message: "Google authentication successful",
					user: {
						...user,
						hashedPassword: undefined,
					}
				}, 200);

			} catch (error) {
				console.error("Google OAuth error:", error);
				throw new HTTPException(500, { message: "Internal server error during authentication" });
			}
		})
	.get("/me",
		JWTGuard(),
		async (ctx) => {
			const { sub: userId } = ctx.get("jwtPayload")
			const user = await getUserById(userId)
			return ctx.json(user, 200)
		})
