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
  {
    name: "helpers",
    entry: ["./helpers/useEditorToRecord.tsx"],
		outDir: "dist/helpers",
    dts: true,
    clean: true,
    unbundle: true,
		external: [
			"@atproto/api",
			"@tiptap/react",
			"@tiptap/core",
			"react",
			"react-dom",
			"astrolabe-test-utils",
		],
  },
]);
