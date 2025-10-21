import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",   // allow 'any'
      "@typescript-eslint/no-unused-vars": "off",    // don't warn for unused vars
      "react/no-unescaped-entities": "off",          // allow apostrophes, quotes
      "react-hooks/exhaustive-deps": "warn",         // warn, don't error
      "@next/next/no-img-element": "off",            // allow <img>
      "@next/next/no-html-link-for-pages": "off",    // allow <a href="">
    },
  },
];

export default eslintConfig;
