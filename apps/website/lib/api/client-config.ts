"use client";

import { client } from "@repo/api-client/client";
import { ApiError } from "@/lib/api/error";

const baseUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/proxy`
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

client.setConfig({ baseUrl, credentials: "include" });

client.interceptors.error.use((error: unknown, response) => {
  const err = error as Record<string, unknown> | undefined;
  const message =
    (err?.error as Record<string, unknown> | undefined)?.message as
      | string
      | undefined ??
    (err?.message as string | undefined) ??
    `Request failed with ${response?.status}`;
  throw new ApiError(message, response?.status ?? 0);
});
