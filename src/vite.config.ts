import commonjsExternals from "vite-plugin-commonjs-externals";
import createExternals from "vite-plugin-external";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import linaria from "@linaria/vite";
import react from "@vitejs/plugin-react";
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
      external: ["react", "react-dom", "react/jsx-runtime", "react-dom/server"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["react", "react-dom"],
  },
  plugins: [
    dts({ tsConfigFilePath: "../tsconfig.json" }),
    // externalGlobals({
    //   // react: "React",
    //   // "react-dom": "ReactDOM",
    // }),
    react(),
    linaria({
      sourceMap: process.env.NODE_ENV !== "production",
    }),
    createExternals({
      externals: {
        react: "React",
        "react-dom": "ReactDOM",
      },
    }),
    // commonjsExternals({ externals: ["react", "react-dom", "react/jsx-runtime", "react-dom/server"] }),
  ],
});
