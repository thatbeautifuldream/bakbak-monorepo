import type { Routing } from "express-zod-api";
import {
  getAnalyticsSnapshotEndpoint,
  ingestAnalyticsEventsEndpoint,
} from "./endpoints/analytics.js";
import { getMeEndpoint, updateProfileEndpoint } from "./endpoints/user.js";

export const routing: Routing = {
  v1: {
    me: {
      get: getMeEndpoint,
      patch: updateProfileEndpoint,
    },
    analytics: {
      events: {
        post: ingestAnalyticsEventsEndpoint,
      },
    },
    admin: {
      analytics: {
        get: getAnalyticsSnapshotEndpoint,
      },
    },
  },
};
