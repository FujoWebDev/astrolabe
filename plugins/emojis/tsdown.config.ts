import { defineConfig } from "tsdown";

export default defineConfig([
	{
		name: "Node",
		entry: ["./src/Node.ts"],
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
			{ from: "./src/emojis.css", to: "./dist/emojis.css" },
		],
	}
]);
