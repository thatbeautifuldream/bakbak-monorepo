import {
  pgEnum,
  pgTable,
  text,
  boolean,
  timestamp,
  index,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userSelectSchema = createSelectSchema(users);
export const userInsertSchema = createInsertSchema(users);
export const userUpdateSchema = createUpdateSchema(users);

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const sessionSelectSchema = createSelectSchema(sessions);
export const sessionInsertSchema = createInsertSchema(sessions);

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const accountSelectSchema = createSelectSchema(accounts);
export const accountInsertSchema = createInsertSchema(accounts);

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const verificationSelectSchema = createSelectSchema(verifications);
export const verificationInsertSchema = createInsertSchema(verifications);

export const analyticsEvents = pgTable(
  "analytics_event",
  {
    id: uuid("id").primaryKey(),
    installationHash: text("installation_hash").notNull(),
    visitId: uuid("visit_id").notNull(),
    eventType: text("event_type").notNull(),
    domain: text("domain").notNull(),
    category: text("category").notNull(),
    language: text("language").notNull(),
    browser: text("browser").notNull(),
    countryCode: text("country_code"),
    regionCode: text("region_code"),
    activeSeconds: integer("active_seconds").notNull().default(0),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("analytics_event_occurred_at_idx").on(table.occurredAt),
    index("analytics_event_installation_occurred_at_idx").on(
      table.installationHash,
      table.occurredAt,
    ),
    index("analytics_event_domain_occurred_at_idx").on(
      table.domain,
      table.occurredAt,
    ),
  ],
);

export const analyticsEventSelectSchema = createSelectSchema(analyticsEvents);
export const analyticsEventInsertSchema = createInsertSchema(analyticsEvents);
