import linaria from "@linaria/rollup";
export default {
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@bobaboard/tiptap-storybook-inspector/preset",
  ],
  framework: "@storybook/react-vite",
  features: {
    storyStoreV7: true,
  },
  staticDirs: ["../stories/utilities/mocks/"],

  async viteFinal(config, { configType }) {
    config.plugins = [
      ...config.plugins,
      linaria.default({
        sourceMap: configType !== "production",
      }),
    ];
    return config;
  },
};
