import { testEndpoint } from "express-zod-api";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  dbMocks,
  mockDbInsertRows,
  mockDbSelectRows,
  resetDbMocks,
} from "../helpers/db.js";
import { resetAuthUser, setAuthUser } from "../helpers/auth.js";

vi.mock("../../src/db/index.js", async () => {
  const { db } = await import("../helpers/db.js");
  return { db };
});

vi.mock("../../src/auth.js", async () => {
  const { createAuthenticatedEndpointsFactory, createAdminEndpointsFactory } =
    await import("../helpers/auth.js");
  return {
    authenticatedEndpointsFactory: createAuthenticatedEndpointsFactory(),
    adminEndpointsFactory: createAdminEndpointsFactory(),
  };
});

const { getAnalyticsSnapshotEndpoint, ingestAnalyticsEventsEndpoint } =
  await import("../../src/endpoints/analytics.js");

afterEach(() => {
  resetAuthUser();
  resetDbMocks();
  vi.useRealTimers();
});

describe("analytics endpoints", () => {
  test("persists a pseudonymous, categorised batch of extension events", async () => {
    mockDbInsertRows([{ id: "11111111-1111-4111-8111-111111111111" }]);

    const { responseMock } = await testEndpoint({
      endpoint: ingestAnalyticsEventsEndpoint,
      requestProps: {
        method: "POST",
        body: {
          installationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          events: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              visitId: "22222222-2222-4222-8222-222222222222",
              eventType: "visit_started",
              domain: "ajitjalandhar.com",
              language: "pa-IN",
              browser: "Chrome",
              occurredAt: "2026-08-10T11:00:00.000Z",
            },
          ],
        },
      },
    });

    expect(responseMock._getJSONData()).toEqual({
      status: "success",
      data: { accepted: 1 },
    });
    expect(dbMocks.insertValues).toHaveBeenCalledWith([
      expect.objectContaining({
        category: "News & media",
        language: "Punjabi",
        installationHash: expect.not.stringContaining("aaaaaaaa"),
      }),
    ]);
    expect(dbMocks.insertOnConflictDoNothing).toHaveBeenCalledOnce();
  });

  test("does not persist local development activity", async () => {
    const { responseMock } = await testEndpoint({
      endpoint: ingestAnalyticsEventsEndpoint,
      requestProps: {
        method: "POST",
        body: {
          installationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          events: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              visitId: "22222222-2222-4222-8222-222222222222",
              eventType: "visit_started",
              domain: "localhost",
              language: "en",
              browser: "Chrome",
              occurredAt: "2026-08-10T11:00:00.000Z",
            },
          ],
        },
      },
    });

    expect(responseMock._getJSONData()).toEqual({
      status: "success",
      data: { accepted: 0 },
    });
    expect(dbMocks.insertValues).not.toHaveBeenCalled();
  });

  test("returns a range-filtered aggregate snapshot to admins", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T12:00:00.000Z"));
    setAuthUser({ role: "admin" });
    mockDbSelectRows([
      {
        id: "11111111-1111-4111-8111-111111111111",
        installationHash: "installation-hash",
        visitId: "22222222-2222-4222-8222-222222222222",
        eventType: "visit_started",
        domain: "ajitjalandhar.com",
        category: "News & media",
        language: "Punjabi",
        browser: "Chrome",
        countryCode: "IN",
        regionCode: "PB",
        activeSeconds: 0,
        occurredAt: new Date("2026-08-10T11:00:00.000Z"),
        createdAt: new Date("2026-08-10T11:00:00.000Z"),
      },
    ]);

    const { responseMock } = await testEndpoint({
      endpoint: getAnalyticsSnapshotEndpoint,
      requestProps: { method: "GET", query: { range: "7d" } },
    });

    expect(responseMock._getStatusCode()).toBe(200);
    const response = responseMock._getJSONData() as {
      status: string;
      data: { range: string; metrics: Array<{ label: string; value: string }> };
    };
    expect(response.status).toBe("success");
    expect(response.data.range).toBe("7d");
    expect(response.data.metrics[0]).toEqual({
      label: "Observed visits",
      value: "1",
      detail: "Across the last 7 days",
      change: "—",
    });
    expect(dbMocks.selectWhere).toHaveBeenCalledOnce();
  });
});
