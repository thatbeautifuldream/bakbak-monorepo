import { createHmac } from "node:crypto";
import { and, gte, lt } from "drizzle-orm";
import { Middleware } from "express-zod-api";
import { z } from "zod";
import { adminEndpointsFactory, authenticatedEndpointsFactory } from "../auth.js";
import { analyticsEvents } from "../db/schema.js";
import { db } from "../db/index.js";
import {
  analyticsRanges,
  buildAnalyticsSnapshot,
  getDomainMetadata,
  type AnalyticsRange,
} from "../domain/analytics.js";

const analyticsEventSchema = z.object({
  id: z.uuid(),
  visitId: z.uuid(),
  eventType: z.enum(["visit_started", "active_time", "voice_started"]),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9.-]+$/),
  language: z.string().trim().min(1).max(32),
  browser: z.string().trim().min(1).max(32),
  activeSeconds: z.number().int().min(0).max(35).default(0),
  occurredAt: z.iso.datetime().transform((value) => new Date(value)),
});

const eventBatchInputSchema = z.object({
  installationId: z.uuid(),
  events: z.array(analyticsEventSchema).min(1).max(25),
});

const toneSchema = z.enum([
  "coral",
  "red",
  "violet",
  "blue",
  "amber",
  "graphite",
]);

const analyticsSnapshotSchema = z.object({
  range: z.enum(analyticsRanges),
  updatedAt: z.string(),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      detail: z.string(),
      change: z.string(),
    }),
  ),
  chart: z.object({
    change: z.string(),
    points: z.string(),
    labels: z.array(z.string()),
  }),
  categories: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      tone: toneSchema,
    }),
  ),
  sites: z.array(
    z.object({
      domain: z.string(),
      language: z.string(),
      visits: z.string(),
      time: z.string(),
      share: z.number(),
      trend: z.string(),
      tone: toneSchema,
    }),
  ),
  locations: z.array(z.object({ label: z.string(), value: z.string() })),
  activityByHour: z.array(
    z.object({
      hour: z.number().int().min(0).max(23),
      conversations: z.number().int().nonnegative(),
    }),
  ),
});

const locationFromRequest = (request: { header: (name: string) => string | undefined }) => {
  const country =
    request.header("cf-ipcountry") ?? request.header("x-vercel-ip-country");
  const region =
    request.header("cf-region-code") ??
    request.header("x-vercel-ip-country-region");
  const countryCode = country?.trim().toUpperCase();
  const regionCode = region?.trim().toUpperCase();

  return {
    countryCode: countryCode && /^[A-Z]{2}$/.test(countryCode) ? countryCode : null,
    regionCode: regionCode && /^[A-Z0-9-]{1,16}$/.test(regionCode) ? regionCode : null,
  };
};

const analyticsEventsFactory = authenticatedEndpointsFactory.addMiddleware(
  new Middleware({
    handler: async ({ request }) => ({
      networkLocation: locationFromRequest(request),
    }),
  }),
);

const hashInstallation = (installationId: string) =>
  createHmac(
    "sha256",
    process.env.ANALYTICS_HASH_SECRET ?? process.env.BETTER_AUTH_SECRET ?? "analytics",
  )
    .update(installationId)
    .digest("hex");

const isLocalDomain = (domain: string) =>
  domain === "localhost" ||
  domain.endsWith(".localhost") ||
  domain === "0.0.0.0" ||
  /^127(?:\.\d{1,3}){3}$/.test(domain);

export const ingestAnalyticsEventsEndpoint =
  analyticsEventsFactory.build({
    method: "post",
    input: eventBatchInputSchema,
    output: z.object({ accepted: z.number().int().nonnegative() }),
    tag: "analytics",
    summary: "Store analytics events",
    description:
      "Stores a bounded batch of pseudonymous extension analytics events for the signed-in user.",
    handler: async ({ input, ctx }) => {
      const location = ctx.networkLocation;
      const installationHash = hashInstallation(input.installationId);
      const rows = input.events.filter((event) => !isLocalDomain(event.domain)).map((event) => {
        const metadata = getDomainMetadata(event.domain, event.language);
        return {
          id: event.id,
          installationHash,
          visitId: event.visitId,
          eventType: event.eventType,
          domain: event.domain,
          category: metadata.category,
          language: metadata.language,
          browser: event.browser,
          countryCode: location.countryCode,
          regionCode: location.regionCode,
          activeSeconds: event.activeSeconds,
          occurredAt: event.occurredAt,
        };
      });
      if (rows.length === 0) return { accepted: 0 };
      const inserted = await db
        .insert(analyticsEvents)
        .values(rows)
        .onConflictDoNothing({ target: analyticsEvents.id })
        .returning({ id: analyticsEvents.id });

      return { accepted: inserted.length };
    },
  });

export const getAnalyticsSnapshotEndpoint = adminEndpointsFactory.build({
  method: "get",
  input: z.object({ range: z.enum(analyticsRanges).default("1d") }),
  output: analyticsSnapshotSchema,
  tag: "analytics",
  summary: "Get analytics dashboard data",
  description:
    "Returns aggregate extension activity for the selected rolling time range.",
  handler: async ({ input }) => {
    const now = new Date();
    const rangeMilliseconds =
      input.range === "1d"
        ? 24 * 60 * 60 * 1000
        : Number.parseInt(input.range, 10) * 24 * 60 * 60 * 1000;
    const start = new Date(now.getTime() - rangeMilliseconds * 2);
    const rows = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.occurredAt, start),
          lt(analyticsEvents.occurredAt, now),
        ),
      );

    return buildAnalyticsSnapshot(rows, input.range as AnalyticsRange, now);
  },
});
