import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../plugins/*/stories/**/*.mdx",
    "../../plugins/*/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../plugins/*/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../plugins/*/*/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
    "@fujocoded/astrolabe-editor-json-viewer",
    "storybook-addon-vis",
  ],
  framework: {
    name: "@storybook/react-vite",
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
