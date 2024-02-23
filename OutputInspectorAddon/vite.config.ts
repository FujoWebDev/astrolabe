// import { viteExternalsPlugins } from "vite-plugin-externals";
import createExternals from "vite-plugin-external";
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
      plugins: [
        // externalGlobals({
        //   react: "React",
        //   "react-dom": "ReactDOM",
        // }),
      ],
      preserveEntrySignatures: "exports-only",
    },
  },
  plugins: [
    dts(),
    react(),
    createExternals({
      externals: {
        react: "React",
        "react-dom": "ReactDOM",
      },
    }),
  ],
});
