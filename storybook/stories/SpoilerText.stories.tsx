import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import {
  EditorProvider,
  FloatingMenu,
  BubbleMenu,
  type EditorProviderProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { InlineSpoilersPlugin } from "@fujocoded/astrolabe-inline-spoilers";
import { InlineSpoilersButton } from "@fujocoded/astrolabe-inline-spoilers/button";
import "@fujocoded/astrolabe-inline-spoilers/css";

type SpoilerText = {};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Astrolabe/SpoilerText",
  //   component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  render: (args) => {
    return (
      <div style={{ backgroundColor: "red" }}>
        <EditorProvider
          extensions={[StarterKit, InlineSpoilersPlugin]}
          content={`<p>${args.initialText}</p>`}
          editable={args.editable ?? true}
        >
          <FloatingMenu editor={null}>This is the floating menu</FloatingMenu>
          <BubbleMenu editor={null}>
            <InlineSpoilersButton editor={null} />
          </BubbleMenu>
        </EditorProvider>
      </div>
    );
  },
} satisfies Meta<EditorProviderProps & { initialText: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {
  args: {
    initialText:
      "Initial <span data-type='inlineSpoilers' data-visible='false'>text 1</span>",
  },
};

export const ViewOnly: Story = {
  args: {
    initialText:
      "Initial <span data-type='inlineSpoilers' data-visible='false'>text 2</span>",
    editable: false,
  },
};
