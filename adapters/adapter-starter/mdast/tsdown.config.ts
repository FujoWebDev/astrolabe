import { defineConfig } from "tsdown";

export default defineConfig([
  {
    name: "mdast",
    entry: ["./src/index.ts"],
    dts: true,
    clean: true,
    unbundle: true,
  },
]);
