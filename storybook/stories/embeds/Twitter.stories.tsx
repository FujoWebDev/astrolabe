import { ComponentMeta, ComponentStoryFn } from "@storybook/react";
import { EXTENSIONS, Editor } from "../../../src/editor";
import { QueryClient, QueryClientProvider } from "react-query";

import { EditableTweetComponent } from "../../../src/plugins/Twitter/Components";
import React from "react";
import { withContentChangeHandler } from "@bobaboard/tiptap-storybook-inspector";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Embeds/Twitter",
  component: EditableTweetComponent,
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
            <Story {...ctx} />
          </div>
        </div>
      );
    },
  ],
} as ComponentMeta<typeof Editor>;

const queryClient = new QueryClient();
const Template: ComponentStoryFn<typeof Editor> = (args) => (
  <QueryClientProvider client={queryClient}>
    <Editor {...args} />
  </QueryClientProvider>
);

export const Editable = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Editable.args = {
  editable: true,
  initialContent: `<article data-type="tweet" data-src="https://twitter.com/horse_ebooks/status/218439593240956928" />`,
};
