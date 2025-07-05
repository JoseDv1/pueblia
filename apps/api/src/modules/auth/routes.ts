import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie"
import { zValidator } from "@/middleware/validator";
import { authGoogleCallbackSchema, authLoginSchema, authRegisterSchema } from "./schema";
import { login, register, findOrCreateGoogleUser, createTokens, refreshToken as refreshTokenService, logout, setAuthCookies } from "./services"
import { HTTPException } from "hono/http-exception";
import { COOKIES, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI } from "@/config";
import * as z from "zod/v4";
import { decode } from "hono/jwt";
import { getUserById } from "../users/services";

export const authRouter = new Hono()
	.post("/login", zValidator("json", authLoginSchema), async (ctx) => {
		const { email, password } = ctx.req.valid("json")
		const user = await login(email, password);
		const tokens = await createTokens(user.id, user.role);
		await setAuthCookies(ctx, tokens);
		return ctx.json({ user }, 200);
	})
	.post("/register", zValidator("json", authRegisterSchema), async (ctx) => {
		const { email, password, confirmPassword, name, displayName } = ctx.req.valid("json");
		const user = await register(email, password, confirmPassword, name, displayName);
		// Send a welcome email or email verification link
		// TODO: Implement email sending logic here

		// Create and set JWT tokens
		const tokens = await createTokens(user.id, user.role);
		await setAuthCookies(ctx, tokens);
		return ctx.json({ user }, 201);
	})
	.post("/refresh", async (ctx) => {
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
	.get("/google", (ctx) => {
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
	.get("/google/callback", zValidator("query", authGoogleCallbackSchema), async (ctx) => {
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
	.get("/logout", zValidator("cookie", z.object({
		"refreshToken": z.string()
	})), async (ctx) => {
		const { refreshToken } = ctx.req.valid("cookie");
		await logout(refreshToken);
		deleteCookie(ctx, COOKIES.accessToken);
		deleteCookie(ctx, COOKIES.refreshToken);
		return ctx.json({ message: "Logged out successfully" }, 200);
	})
	.get("/me", async (ctx) => {
		const cookieToken = getCookie(ctx, COOKIES.accessToken);
		if (!cookieToken) throw new HTTPException(401, { message: "Access token not provided" });
		const { payload } = decode(cookieToken);
		const user = await getUserById(payload.sub as string);
		return ctx.json(user, 200);
	})
