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
  docs: {
    autodocs: "tag",
  },
  staticDirs: ["../stories/utilities/mocks/"],

  async viteFinal(config, { configType }) {
    config.plugins = [...config.plugins];
    config.server = {
      ...config.server,
      hmr: {
        host: "localhost",
        protocol: "ws",
      },
    };
    return config;
  },
};
