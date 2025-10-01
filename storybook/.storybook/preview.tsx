/* eslint-disable unicorn/filename-case */
import StarterKit from "@tiptap/starter-kit";

import type { Preview } from "@storybook/react-vite";

import "./global.css";

const preview = {
  parameters: {
    options: {
      storySort: {
        order: ["*", "Extra"],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    initialPlugins: [StarterKit],
    plugins: [],
    hideEditor: false,
  },
  argTypes: {
    editable: {
      control: "boolean",
    },
  },
  args: {
    editable: true,
    initialText: "<p>This is the default editor text</p>",
    buttons: [],
  },
  decorators: [],
  tags: ["snapshot"],
} satisfies Preview;

export default preview;
