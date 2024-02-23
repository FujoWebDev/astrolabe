import { dirname, join } from "path";
export default {
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],
  framework: getAbsolutePath("@storybook/react-vite"),
  features: {
    storyStoreV7: true,
  },
  docs: {
    autodocs: "tag",
  },

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

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
