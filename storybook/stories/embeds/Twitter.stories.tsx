import { DEFAULT_EXTENSIONS, Editor, EditorProps } from "../../../src/editor";
import { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "react-query";

import { EditableTweetComponent } from "../../../src/plugins/Twitter/Components";
import React from "react";
import { withContentChangeHandler } from "@bobaboard/tiptap-storybook-inspector";

const meta = {
  title: "Embeds/Twitter",
  component: EditableTweetComponent,
  tags: ["autodocs"],
  decorators: [
    withContentChangeHandler([...DEFAULT_EXTENSIONS]),
    (Story, ctx) => {
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              maxWidth: "500px",
              backgroundColor: "antiquewhite",
            }}
          >
            <Story {...ctx} />
          </div>
        </div>
      );
    },
  ],
} as Meta<typeof EditableTweetComponent>;

export default meta;

type Story = StoryObj<EditorProps & { embedUrl?: string }>;

const queryClient = new QueryClient();

export const Editable: Story = {
  args: {
    editable: true,
    initialContent: `<article data-type="tweet" data-src="https://twitter.com/horse_ebooks/status/218439593240956928" />`,
  },
  render: (args) => (
    <QueryClientProvider client={queryClient}>
      <Editor {...args} />
    </QueryClientProvider>
  ),
};
