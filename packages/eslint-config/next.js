import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "eslint-config-next";

export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  ...nextPlugin.configs?.["core-web-vitals"],
  files: ["**/*.{ts,tsx}"],
  rules: {
    ...nextPlugin.configs?.["core-web-vitals"]?.rules,
    "@next/next/no-html-link-for-pages": "off",
  },
});
