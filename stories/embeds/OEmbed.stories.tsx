import { ComponentMeta, ComponentStory } from "@storybook/react";
import { EXTENSIONS, Editor } from "../../src/Editor";
import { QueryClient, QueryClientProvider } from "react-query";

import { OEmbed } from "../../src/plugins/OEmbed/Components";
import React from "react";
import { getContentChangeHandler } from "../utilities/OutputInspectorAddon/src/OutputInspector";

export default {
  title: "Embeds/OEmbeds",
  component: OEmbed,
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
  initialContent: `<article data-type="oembed" src="" />`,
};

export const Bandcamp = Template.bind({});
Bandcamp.args = {
  editable: true,
  initialContent: `<article data-type="oembed" data-src="https://thetwilightsad.bandcamp.com/album/oran-mor-2020" />`,
};
