import { defineConfig } from "tsdown";

export default defineConfig([
	{
		name: "Node",
		entry: ["./src/Node.tsx", "./src/storage/index.ts"],
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
			"@tiptap/core",
			"@tiptap/extension-image",
			"astrolabe-test-utils",
		],
		copy: [
			{ from: "./src/hyperimage.css", to: "./dist/hyperimage.css" },
		],
	}
]);
