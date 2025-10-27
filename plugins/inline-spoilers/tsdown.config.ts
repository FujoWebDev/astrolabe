import { defineConfig } from "tsdown";

export default defineConfig([
	{
		name: "Mark",
		entry: ["./src/Mark.ts"],
		dts: true,
		clean: true,
		unbundle: true,
		format: ["esm"],
		platform: "browser",
		external: [
			"react",
			"react/jsx-runtime",
			"@tiptap/pm",
			"@tiptap/react",
			"astrolabe-test-utils",
		],
		copy: [
			{ from: "./src/inline-spoilers.css", to: "./dist/inline-spoilers.css" },
		],
	},
	{
		name: "remark-spoilers",
		entry: ["./adapter/remark-node.ts"],
		dts: true,
		clean: true,
		unbundle: true,
		format: ["esm"],
		platform: "browser",
		external: [
			"react",
			"react/jsx-runtime",
			"@tiptap/pm",
			"@tiptap/react",
			"astrolabe-test-utils",
		],
	},
	{
		name: "adapter-spoilers",
		entry: ["./adapter/spoilers.ts"],
		format: ["esm"],
		dts: true,
		clean: true,
		unbundle: true,
	},
]);
