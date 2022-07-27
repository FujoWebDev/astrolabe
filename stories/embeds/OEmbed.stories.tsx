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
const Template: ComponentStory<
  (props: Parameters<typeof Editor>[0] & { embedUrl?: string }) => JSX.Element
> = (args) => (
  <QueryClientProvider client={queryClient}>
    <Editor
      {...args}
      initialContent={
        args.embedUrl
          ? `<article data-type="oembed" data-src="${args.embedUrl}" />`
          : args.initialContent
      }
    />
  </QueryClientProvider>
);

export const Empty = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Empty.args = {
  editable: true,
};

export const Bandcamp = Template.bind({});
Bandcamp.args = {
  editable: true,
  embedUrl: `https://thetwilightsad.bandcamp.com/album/oran-mor-2020`,
};

export const Pixiv = Template.bind({});
Pixiv.args = {
  editable: true,
  embedUrl: `https://www.pixiv.net/en/artworks/83682624`,
};

export const Tumblr = Template.bind({});
Tumblr.args = {
  editable: true,
  embedUrl: `https://bobaboard.tumblr.com/post/647298900927053824/this-april-1st-bobaboard-is-proud-to-bring-its`,
};
