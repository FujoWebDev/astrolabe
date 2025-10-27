import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

function getWorkspacePackages(): string[] {
	try {
		const output = execSync("pnpm -r list --json", {
			cwd: repoRoot,
			encoding: "utf-8",
		});
		const packages = JSON.parse(output);
		return packages.map((pkg: { name: string }) => pkg.name);
	} catch (error) {
		console.error("Failed to get workspace packages:", error);
		return [];
	}
}

const config: StorybookConfig = {
	stories: [
		"../stories/**/*.mdx",
		"../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../../plugins/*/stories/**/*.mdx",
		"../../plugins/*/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../../adapters/*/*.stories.@(js|jsx|mjs|ts|tsx)",
		"../../adapters/*/*/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
	],
	addons: [
		"@storybook/addon-docs",
		"@storybook/addon-vitest",
		"@fujocoded/astrolabe-editor-tree-viewer",
	],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	viteFinal: (config) => {
		// Optimize deps to handle workspace packages properly
		config.optimizeDeps = config.optimizeDeps ?? {};
		config.optimizeDeps.exclude = [
			...(config.optimizeDeps.exclude || []),
			// Exclude workspace packages from pre-bundling
			// so Vite picks up changes when dist files are rebuilt
			...getWorkspacePackages(),
		];

		return config;
	},
};
export default config;
