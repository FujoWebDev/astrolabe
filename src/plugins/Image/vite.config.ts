import createExternals from "vite-plugin-external";
import { defineConfig } from "vite";
import linaria from "@linaria/vite";
import path from "path";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "index.ts"),
      name: "TipTapImage",
      formats: ["cjs", "es"],
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
});
