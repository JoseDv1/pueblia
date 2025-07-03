import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie"
import { zValidator } from "@/middleware/validator";
import { authLoginSchema, authRegisterSchema } from "./schema";
import { login, register, findOrCreateGoogleUser } from "./services"
import { HTTPException } from "hono/http-exception";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI } from "@/config";


export const authRouter = new Hono()
	.post("/login", zValidator("json", authLoginSchema), async (ctx) => {
		const { email, password } = ctx.req.valid("json")
		const user = await login(email, password);
		return ctx.json({ user }, 200);
	})
	.post("/register", zValidator("json", authRegisterSchema), async (ctx) => {
		const { email, password, confirmPassword, name, displayName } = ctx.req.valid("json");
		const user = await register(email, password, confirmPassword, name, displayName);
		return ctx.json({ user }, 201);
	})
	.get("/google", (ctx) => {
		if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
			throw new HTTPException(500, { message: "Google OAuth not configured" });
		}
		const state = crypto.randomUUID();

		// Store state in session/cookie for verification later
		setCookie(ctx, "oauth_state", state, { httpOnly: true, sameSite: "Lax", maxAge: 600, path: "/" });
		const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

		googleAuthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
		googleAuthUrl.searchParams.set("redirect_uri", OAUTH_REDIRECT_URI);
		googleAuthUrl.searchParams.set("response_type", "code");
		googleAuthUrl.searchParams.set("scope", "openid email profile");
		googleAuthUrl.searchParams.set("state", state);

		return ctx.redirect(googleAuthUrl.toString());
	})
	.get("/google/callback", async (ctx) => {
		if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
			throw new HTTPException(500, { message: "Google OAuth not configured" });
		}
		const code = ctx.req.query("code");
		const state = ctx.req.query("state");
		const error = ctx.req.query("error");

		if (error) {
			throw new HTTPException(400, { message: `OAuth error: ${error}` });
		}
		if (!code || !state) {
			throw new HTTPException(400, { message: "Missing authorization code or state" });
		}

		const stateCookie = getCookie(ctx, "oauth_state");
		if (!stateCookie) {
			throw new HTTPException(400, { message: "Missing state cookie" });
		}
		if (state !== stateCookie) {
			throw new HTTPException(400, { message: "Invalid state parameter" });
		}

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
			if (!tokenResponse.ok) {
				throw new HTTPException(400, { message: "Failed to exchange code for token" });
			}
			const tokenData = await tokenResponse.json();
			const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
				headers: {
					Authorization: `Bearer ${tokenData.access_token}`,
				},
			});
			if (!userResponse.ok) {
				throw new HTTPException(400, { message: "Failed to get user info from Google" });
			}

			const googleUser = await userResponse.json();

			// Find or create user in our database
			const user = await findOrCreateGoogleUser({
				id: googleUser.id,
				email: googleUser.email,
				name: googleUser.name,
				picture: googleUser.picture,
			});

			// Clear state cookie
			deleteCookie(ctx, "oauth_state");


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
