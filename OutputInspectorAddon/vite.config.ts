import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "path";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    outDir: path.resolve(__dirname, "dist/"),
    rollupOptions: {
      input: {
        manager: path.resolve(__dirname, "src/manager.tsx"),
        index: path.resolve(__dirname, "src/index.ts"),
        preset: path.resolve(__dirname, "src/preset.js"),
      },
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        entryFileNames: "[name].js",
      },
      preserveEntrySignatures: "exports-only",
    },
  },
  plugins: [dts(), react()],
});
