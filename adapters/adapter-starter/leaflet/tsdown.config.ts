import { defineConfig } from "tsdown";

export default defineConfig([
  {
    name: "leaflet",
    entry: ["./src/index.ts"],
    dts: true,
    clean: true,
    unbundle: true,
  },
]);
