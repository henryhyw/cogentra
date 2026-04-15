import js from "@eslint/js";
import next from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@next/next": next,
      "react-hooks": reactHooks
    },
    rules: {
      ...next.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules
    }
  }
];
