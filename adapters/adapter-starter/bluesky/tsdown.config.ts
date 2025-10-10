import { defineConfig } from "tsdown";

export default defineConfig([
  {
    name: "bluesky",
    entry: ["./src/index.ts"],
    dts: true,
    clean: true,
    unbundle: true,
    external: ["@atproto/api", "@playwright/test"],
  },
]);
