import { DEFAULT_EXTENSIONS, Editor } from "../../src/editor";
import { Meta, StoryObj } from "@storybook/react";

import Italic from "@tiptap/extension-italic";
import { MenuButtonProps } from "../../src/editor/BubbleMenu";
import React from "react";
import { withContentChangeHandler } from "@bobaboard/tiptap-storybook-inspector";

// We use const meta = {...} as Meta<typeof Component> instead of const meta:Meta<typeof Component> = {...} as shown in the CSF3 docs
// because in the second case the typing becomes too specific to work with the generics in the DecoratorFunction type of withContentChangeHandler
// More on the CSF3 story format: https://storybook.js.org/docs/7.0/react/api/csf
const meta = {
  title: "Editor",
  component: Editor,
  tags: ["autodocs"],
  decorators: [
    withContentChangeHandler([...DEFAULT_EXTENSIONS, Italic]),
    (Story, ctx) => {
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              maxWidth: "500px",
              backgroundColor: "antiquewhite",
            }}
          >
            <Story
              args={{
                ...ctx.args,
              }}
            />
          </div>
        </div>
      );
    },
  ],
} as Meta<typeof Editor>;

export default meta;

type Story = StoryObj<typeof Editor>;

export const Editable: Story = {
  // More on args: https://storybook.js.org/docs/7.0/react/api/csf#args-story-inputs
  args: {
    editable: true,
    addedExtensions: [Italic],
    initialContent: `<picture data-type="image"><img src="https://placekitten.com/200/300" /></picture>`,
  },
};

export const ViewOnly: Story = {
  args: {
    ...Editable.args,
    editable: false,
  },
};

export const Italics: Story = {
  args: {
    ...Editable.args,
    initialContent: `<p>but what if I'm <strong>really</strong>, <em>really</em>, <strong><em>really</em></strong> excited!!!</p>`,
    addedExtensions: [Italic],
    customBubbleMenuButtons: [
      {
        extensionName: "italic",
        menuButton: ({ editor }: MenuButtonProps) => {
          return (
            <button
              title="italic"
              aria-label="italic"
              aria-pressed={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <em>Italic</em>
            </button>
          );
        },
      },
    ],
  },
};
