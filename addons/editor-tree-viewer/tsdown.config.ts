import { defineConfig } from "tsdown";

import { globalPackages as globalManagerPackages } from "storybook/internal/manager/globals";
import { globalPackages as globalPreviewPackages } from "storybook/internal/preview/globals";

const TIPTAP_DEPENDENCIES = [
  "@tiptap/starter-kit",
  "@tiptap/react",
  "@tiptap/core",
];

export default defineConfig([
  {
    name: "Editor Tree Viewer (manager)",
    entry: [
      "./src/manager.tsx",
      "src/Panel.tsx",
      "./src/constants.ts",
      "./src/types.ts",
    ],
    dts: true,
    clean: true,
    format: ["esm"],
    platform: "browser",
    external: [...TIPTAP_DEPENDENCIES, ...globalManagerPackages],
  },
  {
    name: "Editor Tree Viewer (preview)",
    entry: ["./src/decorator.tsx"],
    dts: true,
    clean: true,
    format: ["esm"],
    platform: "browser",

    external: [
      ...TIPTAP_DEPENDENCIES,
      // TODO: I have no idea why these need to be here
      "react",
      "react-dom",
      "react-dom/client",
      ...globalPreviewPackages,
    ],
  },
]);
