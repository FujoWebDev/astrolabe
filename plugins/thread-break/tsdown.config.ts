import { defineConfig } from "tsdown";

export default defineConfig([
  {
    name: "Node",
    entry: ["./src/Node.tsx"],
    dts: true,
    clean: true,
    unbundle: true,
    format: ["esm"],
    platform: "browser",
    external: [
      "react",
      "react/jsx-runtime",
      "@tiptap/pm",
      "@tiptap/react",
      "@tiptap/core",
      "astrolabe-test-utils",
      "react-aria-components",
      "isomorphic-dompurify",
    ],
    copy: [{ from: "./src/thread-break.css", to: "./dist/thread-break.css" }],
  },
  {
    name: "popover",
    entry: ["./src/popover.tsx"],
    dts: true,
    clean: false,
    unbundle: true,
    format: ["esm"],
    platform: "browser",
    external: ["react", "react/jsx-runtime", "react-aria-components"],
  },
  {
    name: "adapter",
    entry: ["./adapter/thread-break.ts", "./adapter/remark-node.ts"],
    dts: true,
    clean: false,
    unbundle: true,
    format: ["esm"],
    platform: "neutral",
    external: [
      "@tiptap/core",
      "@atproto/api",
      "mdast",
      "mdast-util-to-markdown",
    ],
  },
]);
