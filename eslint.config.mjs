import nextVitals from "./tools/lint/node_modules/eslint-config-next/dist/core-web-vitals.js";

export default [
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "qa-output/**",
      "docs/**",
      ".agents/**",
      "tools/**",
    ],
  },
];
