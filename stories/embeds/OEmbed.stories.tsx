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

export const Pixiv = Template.bind({});
Pixiv.args = {
  editable: true,
  initialContent: `<article data-type="oembed" data-src="https://www.pixiv.net/en/artworks/83682624" />`,
};

export const Tumblr = Template.bind({});
Tumblr.args = {
  editable: true,
  initialContent: `<article data-type="oembed" data-src="https://bobaboard.tumblr.com/post/647298900927053824/this-april-1st-bobaboard-is-proud-to-bring-its" />`,
};
