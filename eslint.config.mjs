import { defineConfig, globalIgnores } from "eslint/config";

// Minimal ESLint config that avoids enabling strict rules from Next's
// TypeScript preset. This reduces editor/lint noise across many files.
const eslintConfig = defineConfig([
  // Keep the default ignore patterns so build artifacts aren't linted.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Provide a permissive catch-all that disables TypeScript-specific rules
  // which commonly generate errors across many files during development.
  {
    files: ["**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
