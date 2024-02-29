import { defineConfig } from "vite";
import linaria from "@linaria/vite";
import path from "path";
import react from "@vitejs/plugin-react";
import createExternals from "vite-plugin-external";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: path.resolve(__dirname, "index.ts"),
      name: "TipTapInlineSpoilers",
      formats: ["cjs", "es"],
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
