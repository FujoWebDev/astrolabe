import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import { EditorProvider, FloatingMenu, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

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
          extensions={[StarterKit]}
          content={`<p>${args.initialText}</p>`}
        >
          <FloatingMenu editor={null}>This is the floating menu</FloatingMenu>
          <BubbleMenu editor={null}>This is the bubble menu</BubbleMenu>
        </EditorProvider>
      </div>
    );
  },
} satisfies Meta<SpoilerText & { initialText: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Editable: Story = {
  args: {
    initialText: "Initial text 1",
  },
};

export const ViewOnly: Story = {
  args: {
    initialText: "Initial text 2",
  },
};
