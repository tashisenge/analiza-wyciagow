import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginImport from "eslint-plugin-import";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "playwright-report/**",
      "eslint.config.mjs",
      "vitest.config.ts",
      "next-env.d.ts",
      "postcss.config.mjs",
      "scripts/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    plugins: { import: eslintPluginImport },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      complexity: ["error", 8],
      "max-depth": ["error", 2],
      "max-lines-per-function": [
        "error",
        { max: 25, skipBlankLines: true, skipComments: true },
      ],
      "max-lines": ["error", { max: 200, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", 3],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-default-export": "off",
    },
  },
  {
    files: ["src/app/**/*", "next.config.ts"],
    rules: {
      "import/no-default-export": "off",
    },
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      "max-lines-per-function": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-deprecated": "off",
    },
  },
  {
    files: ["src/components/**/*.tsx", "src/app/**/*.tsx"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 120, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["error", 12],
    },
  },
  {
    files: ["src/server/actions/**/*.ts"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 45, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["error", 10],
    },
  },
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 45, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ["src/lib/ai/**/*.ts"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 45, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["error", 14],
    },
  },
  {
    files: ["src/lib/categorization/**/*.ts"],
    rules: {
      "max-params": ["error", 4],
    },
  },
  {
    files: [
      "src/lib/analytics/load-dashboard.ts",
      "src/lib/analytics/load-dashboard-metrics.ts",
      "src/lib/analytics/load-dashboard-extras.ts",
      "src/lib/analytics/load-dashboard-page.ts",
      "src/lib/transactions/load-transactions-page.ts",
      "src/lib/transactions/fetch-transactions-page-bundle.ts",
    ],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 55, skipBlankLines: true, skipComments: true },
      ],
      "max-lines": ["error", { max: 260, skipBlankLines: true, skipComments: true }],
      "max-params": ["error", 4],
    },
  },
);
