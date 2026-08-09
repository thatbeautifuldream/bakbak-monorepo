import { testEndpoint } from "express-zod-api";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  dbMocks,
  mockDbSelectRows,
  mockDbUpdateRows,
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

const { getMeEndpoint, updateProfileEndpoint } =
  await import("../../src/endpoints/user.js");

describe("user endpoints", () => {
  afterEach(() => {
    resetAuthUser();
    resetDbMocks();
  });

  test("getMeEndpoint returns the current user", async () => {
    setAuthUser({ id: "user-123" });
    mockDbSelectRows([
      {
        id: "user-123",
        name: "Milind",
        email: "milind@example.com",
        emailVerified: true,
        image: null,
        role: "user",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const { responseMock } = await testEndpoint({ endpoint: getMeEndpoint });

    expect(responseMock._getStatusCode()).toBe(200);
    expect(responseMock._getJSONData()).toEqual({
      status: "success",
      data: {
        id: "user-123",
        name: "Milind",
        email: "milind@example.com",
        emailVerified: true,
        role: "user",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(dbMocks.selectWhere).toHaveBeenCalledOnce();
  });

  test("updateProfileEndpoint updates profile fields", async () => {
    setAuthUser({ id: "user-123" });
    mockDbUpdateRows([
      { name: "New Name", image: "https://example.com/avatar.png" },
    ]);

    const { responseMock } = await testEndpoint({
      endpoint: updateProfileEndpoint,
      requestProps: {
        method: "PATCH",
        body: { name: "New Name", image: "https://example.com/avatar.png" },
      },
    });

    expect(responseMock._getStatusCode()).toBe(200);
    expect(responseMock._getJSONData()).toEqual({
      status: "success",
      data: {
        success: true,
        name: "New Name",
        image: "https://example.com/avatar.png",
      },
    });
    expect(dbMocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New Name",
        image: "https://example.com/avatar.png",
      }),
    );
  });

  test("updateProfileEndpoint rejects invalid input", async () => {
    const { responseMock } = await testEndpoint({
      endpoint: updateProfileEndpoint,
      requestProps: { method: "PATCH", body: { image: "not-a-url" } },
    });

    expect(responseMock._getStatusCode()).toBe(400);
    expect(responseMock._getJSONData()).toMatchObject({ status: "error" });
  });
});
