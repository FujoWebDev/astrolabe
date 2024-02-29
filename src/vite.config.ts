import { defineConfig } from "vite";
import linaria from "@linaria/vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import createExternals from "vite-plugin-external";
const path = require("path");

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, "./editor/index.tsx"),
      name: "BobaEditor",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  plugins: [
    react(),
    linaria({
      sourceMap: process.env.NODE_ENV !== "production",
    }),
    dts({ tsConfigFilePath: "../tsconfig.json" }),
    createExternals({
      externals: {
        react: "React",
        "react-dom": "ReactDOM",
      },
    }),
  ],
  optimizeDeps: {
    exclude: ["react", "react-dom"],
  },
});
