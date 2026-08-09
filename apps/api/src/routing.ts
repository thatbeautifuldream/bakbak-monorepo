import type { Routing } from "express-zod-api";
import { getMeEndpoint, updateProfileEndpoint } from "./endpoints/user.js";
import {
  getVoicesEndpoint,
  planNarrationEndpoint,
  speakEndpoint,
} from "./endpoints/tts.js";

export const routing: Routing = {
  v1: {
    me: {
      get: getMeEndpoint,
      patch: updateProfileEndpoint,
    },
    tts: {
      voices: { get: getVoicesEndpoint },
      plan: { post: planNarrationEndpoint },
      speak: { post: speakEndpoint },
    },
  },
};
