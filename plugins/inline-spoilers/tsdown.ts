import { defineConfig } from "tsdown";

export default defineConfig([
  {
    name: "Mark",
    entry: ["./src/Mark.tsx"],
    dts: true,
    clean: true,
    unbundle: true,
    platform: "browser",
    external: ["react", "react/jsx-runtime", "@tiptap/pm", "@tiptap/react"],
    copy: [
      { from: "./src/types.d.ts", to: "./dist/types.d.ts" },
      { from: "./src/inline-spoiler.css", to: "./dist/inline-spoiler.css" },
    ],
  },
]);
