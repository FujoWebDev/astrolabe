import { ComponentMeta, ComponentStory } from "@storybook/react";
import { EXTENSIONS, Editor } from "../../src/Editor";
import { QueryClient, QueryClientProvider } from "react-query";

import { EditableTweetComponent } from "../../src/plugins/Twitter/Components";
import React from "react";
import { getContentChangeHandler } from "../utilities/OutputInspectorAddon/src/OutputInspector";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Embeds/Twitter",
  component: EditableTweetComponent,
  decorators: [
    (Story, ctx) => {
      const onContentChangeHandler = React.useCallback(
        getContentChangeHandler(EXTENSIONS),
        []
      );
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
                onContentChange: onContentChangeHandler,
              }}
            />
          </div>
        </div>
      );
    },
  ],
} as ComponentMeta<typeof Editor>;

const queryClient = new QueryClient();
const Template: ComponentStory<typeof Editor> = (args) => (
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
