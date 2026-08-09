import { defaultEndpointsFactory, Middleware } from "express-zod-api";

type TestAuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string;
};

const defaultAuthUser: TestAuthUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  image: null,
  role: "user",
};

let authUser = defaultAuthUser;

export const setAuthUser = (user: Partial<TestAuthUser> = {}) => {
  authUser = { ...defaultAuthUser, ...user };
};

export const getAuthUser = () => authUser;

export const resetAuthUser = () => setAuthUser();

export const createAuthenticatedEndpointsFactory = () =>
  defaultEndpointsFactory.addMiddleware(
    new Middleware({
      handler: async () => ({
        authUser,
        authSession: { id: "session-1", userId: authUser.id },
      }),
    }),
  );

export const createAdminEndpointsFactory = () =>
  createAuthenticatedEndpointsFactory().addMiddleware(
    new Middleware({
      handler: async ({ ctx }) => {
        if ((ctx.authUser as TestAuthUser).role !== "admin") {
          throw new Error("Admin access required");
        }
        return {};
      },
    }),
  );
