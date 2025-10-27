import { defineConfig } from "tsdown";

export default defineConfig([
	{
		name: "test-utils",
		entry: ["./src/index.ts"],
		dts: true,
		clean: true,
		unbundle: true,

		loader: {
			".png": "base64",
		},
		external: [
			"@atproto/api",
			"@tiptap/react",
			"@tiptap/core",
			"react",
			"react/jsx-runtime",
			"@tiptap/pm",
			"@tiptap/starter-kit",
			"@fujocoded/astdapters-bluesky-starter",
		],
	},
]);
