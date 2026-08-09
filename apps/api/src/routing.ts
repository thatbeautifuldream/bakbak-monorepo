import type { Routing } from "express-zod-api";
import { getMeEndpoint, updateProfileEndpoint } from "./endpoints/user.js";
import { speakEndpoint } from "./endpoints/tts.js";

export const routing: Routing = {
  v1: {
    me: {
      get: getMeEndpoint,
      patch: updateProfileEndpoint,
    },
    tts: {
      speak: { post: speakEndpoint },
    },
  },
};
