import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.tsx", "./src/button.tsx"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: "es2022",
  external: ["react", "react/jsx-runtime", "@tiptap/pm", "@tiptap/react"],
});
