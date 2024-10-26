import { defineConfig } from "vite";
import linaria from "@linaria/vite";
import react from "@vitejs/plugin-react";
const path = require("path");

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "./editor/index.tsx"),
      name: "BobaEditor",
    },
    rollupOptions: {
      // Suppressing this warning from coming up for every iconoir-react file.
      // It fine to ignore, see https://github.com/TanStack/query/pull/5161#issuecomment-1476840472
      // It seems like this is fixed automatically in updated versions of Vite,
      // but I'm not prepared to upgrade Vite right now.
      onwarn(warning, warn) {
        if (
          warning.code === "MODULE_LEVEL_DIRECTIVE" &&
          warning.message.includes(`"use client"`)
        ) {
          return;
        }
        warn(warning);
      },
      //   external: ["react", "react-dom"],
      //   output: {
      //     globals: {
      //       react: "React",
      //       "react-dom": "ReactDOM",
      //     },
      //   },
    },
  },
  plugins: [
    react(),
    linaria({
      sourceMap: process.env.NODE_ENV !== "production",
    }),
  ],
});
