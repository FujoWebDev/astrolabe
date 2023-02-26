import { EXTENSIONS, Editor } from "../../src/editor";
import { Meta, StoryObj } from "@storybook/react";

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
    withContentChangeHandler(EXTENSIONS),
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
    initialContent: `<picture data-type="image"><img src="https://placekitten.com/200/300" /></picture>`,
  },
};

export const ViewOnly: Story = {
  args: {
    ...Editable.args,
    editable: false,
  },
};
