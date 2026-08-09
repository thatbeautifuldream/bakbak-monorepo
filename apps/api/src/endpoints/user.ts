import { z } from "zod";
import { eq } from "drizzle-orm";
import { authenticatedEndpointsFactory } from "../auth.js";
import { db } from "../db/index.js";
import { users, userSelectSchema, userUpdateSchema } from "../db/schema.js";

type ApiEndpoint = ReturnType<typeof authenticatedEndpointsFactory.build>;

const meOutputSchema = userSelectSchema
  .pick({
    id: true,
    name: true,
    email: true,
    emailVerified: true,
    image: true,
    role: true,
  })
  .extend({
    image: z.string().optional(),
    createdAt: z.string().describe("Account creation timestamp"),
  });

const updateProfileInputSchema = userUpdateSchema
  .pick({ name: true, image: true })
  .extend({
    name: z.string().min(1).max(100).optional().describe("Display name"),
    image: z.string().url().optional().nullable().describe("Profile picture URL"),
  });

const updateProfileOutputSchema = z.object({
  success: z.boolean().describe("Whether the profile update succeeded"),
  name: z.string().optional().describe("Updated display name"),
  image: z.string().optional().describe("Updated profile picture URL"),
});

export const getMeEndpoint: ApiEndpoint = authenticatedEndpointsFactory.build({
  method: "get",
  input: z.object({}),
  tag: "users",
  description:
    "Returns the authenticated user's profile, including email verification status, role, and account creation date.",
  summary: "Get current user",
  output: meOutputSchema,
  handler: async ({ ctx }) => {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, ctx.authUser.id));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image ?? undefined,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  },
});

export const updateProfileEndpoint: ApiEndpoint =
  authenticatedEndpointsFactory.build({
    method: "patch",
    input: updateProfileInputSchema,
    tag: "users",
    description:
      "Updates the authenticated user's profile fields (name and/or image).",
    summary: "Update profile",
    output: updateProfileOutputSchema,
    handler: async ({ input, ctx }) => {
      const updates: { name?: string; image?: string | null; updatedAt: Date } =
        {
          updatedAt: new Date(),
        };
      if (input.name !== undefined) updates.name = input.name;
      if (input.image !== undefined) updates.image = input.image;

      const [updated] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, ctx.authUser.id))
        .returning({ name: users.name, image: users.image });

      return {
        success: true,
        name: updated.name,
        image: updated.image ?? undefined,
      };
    },
  });
