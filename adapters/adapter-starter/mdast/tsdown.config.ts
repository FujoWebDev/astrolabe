import { defineConfig } from "tsdown";

export default defineConfig([
  {
    name: "mdast",
    entry: ["./src/index.ts"],
    dts: true,
    clean: true,
    unbundle: true,
  },

  {
    name: "helpers",
    entry: ["./helpers/useEditorToMdast.tsx"],
    outDir: "dist/helpers",
    dts: true,
    clean: true,
    unbundle: true,
    external: ["@tiptap/react", "@tiptap/core", "react", "react-dom", "../src/index"],
  },
]);
