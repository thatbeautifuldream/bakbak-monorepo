import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { fromNodeHeaders } from "better-auth/node";
import { bearer } from "better-auth/plugins";
import { defaultEndpointsFactory, Middleware } from "express-zod-api";
import createError from "http-errors";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";

const trustedOrigins = (
  process.env.TRUSTED_ORIGINS ?? "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  appName: process.env.APP_NAME ?? "Bakbak",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins,
  advanced: {
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  account: {
    storeStateStrategy: "cookie",
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [bearer()],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
}) as any;

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = AuthSession["user"];

const authMiddleware = new Middleware({
  handler: async ({ request }) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      throw createError(401, "Authentication required");
    }

    return {
      authSession: session.session,
      authUser: session.user,
    };
  },
});

export const authenticatedEndpointsFactory =
  defaultEndpointsFactory.addMiddleware(authMiddleware);

const adminMiddleware = new Middleware({
  handler: async ({ ctx }) => {
    if ((ctx.authUser as { role?: string }).role !== "admin") {
      throw createError(403, "Admin access required");
    }
    return {};
  },
});

export const adminEndpointsFactory =
  authenticatedEndpointsFactory.addMiddleware(adminMiddleware);
