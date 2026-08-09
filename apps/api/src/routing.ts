import type { Routing } from "express-zod-api";
import { getMeEndpoint, updateProfileEndpoint } from "./endpoints/user.js";

export const routing: Routing = {
  v1: {
    me: {
      get: getMeEndpoint,
      patch: updateProfileEndpoint,
    },
  },
};
