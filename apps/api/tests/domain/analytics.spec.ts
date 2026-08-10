import { describe, expect, test } from "vitest";
import {
  buildAnalyticsSnapshot,
  type AnalyticsEventRecord,
} from "../../src/domain/analytics.js";

const now = new Date("2026-08-10T12:00:00.000Z");

const event = (
  overrides: Partial<AnalyticsEventRecord> = {},
): AnalyticsEventRecord => ({
  installationHash: "install-a",
  visitId: "11111111-1111-4111-8111-111111111111",
  eventType: "visit_started",
  domain: "ajitjalandhar.com",
  category: "News & media",
  language: "Punjabi",
  browser: "Chrome",
  countryCode: "IN",
  regionCode: "PB",
  activeSeconds: 0,
  occurredAt: new Date("2026-08-10T11:00:00.000Z"),
  ...overrides,
});

describe("buildAnalyticsSnapshot", () => {
  test("builds one-day metrics from persisted events and their preceding period", () => {
    const events = [
      event(),
      event({ eventType: "active_time", activeSeconds: 30 }),
      event({ eventType: "voice_started" }),
      event({
        installationHash: "install-b",
        visitId: "22222222-2222-4222-8222-222222222222",
        domain: "example.com",
        category: "Other",
        language: "English",
        browser: "Firefox",
        countryCode: "US",
        regionCode: "US-CA",
        occurredAt: new Date("2026-08-10T10:00:00.000Z"),
      }),
      event({
        installationHash: "install-b",
        visitId: "22222222-2222-4222-8222-222222222222",
        eventType: "active_time",
        domain: "example.com",
        category: "Other",
        language: "English",
        browser: "Firefox",
        countryCode: "US",
        regionCode: "US-CA",
        activeSeconds: 60,
        occurredAt: new Date("2026-08-10T10:30:00.000Z"),
      }),
      event({
        installationHash: "install-c",
        visitId: "33333333-3333-4333-8333-333333333333",
        occurredAt: new Date("2026-08-09T11:00:00.000Z"),
      }),
    ];

    const snapshot = buildAnalyticsSnapshot(events, "1d", now);

    expect(snapshot.metrics).toEqual([
      expect.objectContaining({ label: "Observed visits", value: "2", change: "+100.0%" }),
      expect.objectContaining({ label: "Active extensions", value: "2" }),
      expect.objectContaining({ label: "Average active time", value: "45s" }),
      expect.objectContaining({ label: "Voice-assisted visits", value: "1" }),
    ]);
    expect(snapshot.categories).toEqual([
      expect.objectContaining({ label: "News & media", value: 50 }),
      expect.objectContaining({ label: "Other", value: 50 }),
    ]);
    expect(snapshot.sites).toEqual([
      expect.objectContaining({ domain: "ajitjalandhar.com", visits: "1", time: "30s" }),
      expect.objectContaining({ domain: "example.com", visits: "1", time: "1m 00s" }),
    ]);
    expect(snapshot.locations).toEqual(
      expect.arrayContaining([
        { label: "Punjab", value: "50%" },
        { label: "Outside India", value: "50%" },
      ]),
    );
    expect(snapshot.browsers).toEqual(
      expect.arrayContaining([
        { label: "Chrome", value: "50%" },
        { label: "Firefox", value: "50%" },
      ]),
    );
  });

  test("uses daily buckets for seven- and fourteen-day ranges", () => {
    const events = [
      event({ occurredAt: new Date("2026-08-04T12:00:00.000Z") }),
      event({
        visitId: "22222222-2222-4222-8222-222222222222",
        occurredAt: new Date("2026-08-09T12:00:00.000Z"),
      }),
    ];

    expect(buildAnalyticsSnapshot(events, "7d", now).chart.labels).toHaveLength(7);
    expect(buildAnalyticsSnapshot(events, "14d", now).chart.labels).toHaveLength(7);
  });
});
