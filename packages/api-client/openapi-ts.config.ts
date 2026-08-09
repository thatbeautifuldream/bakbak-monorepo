import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../../apps/api/docs/openapi.json",
  output: {
    path: "client",
    postProcess: ["prettier"],
  },
  plugins: [
    "@hey-api/sdk",
    {
      name: "@tanstack/react-query",
      queryOptions: true,
      queryKeys: true,
      mutationOptions: true,
    },
  ],
});
