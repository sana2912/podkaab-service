// Shared ESLint flat config for JavaScript-based config files in the monorepo.
/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    files: ["**/*.{js,cjs,mjs}"],
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/*.d.ts"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
];

export default config;
