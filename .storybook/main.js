const linaria = require("@linaria/rollup").default;

module.exports = {
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "../stories/utilities/OutputInspectorAddon/dist/register.js",
  ],
  framework: "@storybook/react",
  core: {
    builder: "@storybook/builder-vite",
  },
  features: {
    storyStoreV7: true,
  },
  staticDirs: ["../stories/utilities/mocks/"],
  async viteFinal(config, { configType }) {
    config.plugins = [
      ...config.plugins,
      linaria({
        sourceMap: configType !== "production",
      }),
    ];
    return config;
  },
};
