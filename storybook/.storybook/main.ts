import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

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
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-vitest"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  viteFinal: (config) => {
    config.optimizeDeps = config.optimizeDeps ?? {
      exclude: ["chromium-bidi", "playwright", "@playwright/test"],
    };
    return config;
  },
};
export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
