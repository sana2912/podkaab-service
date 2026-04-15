/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,cjs,mjs}"],
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/*.d.ts",
      "packages/db/node_modules/**",
    ],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
];
