import { DEFAULT_EXTENSIONS, Editor, EditorProps } from "../../../src/editor";
import { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "react-query";

import React from "react";
// import { withContentChangeHandler } from "@bobaboard/tiptap-storybook-inspector";

const meta = {
  title: "Embeds/OEmbeds",
  tags: ["autodocs"],
  decorators: [
    // withContentChangeHandler([...DEFAULT_EXTENSIONS]),
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
} as Meta;

export default meta;

type Story = StoryObj<EditorProps & { embedUrl?: string }>;

const queryClient = new QueryClient();

export const Empty: Story = {
  args: {
    editable: true,
  },
  render: (args) => (
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
  ),
};

export const Bandcamp: Story = {
  ...Empty,
  args: {
    editable: true,
    embedUrl: `https://thetwilightsad.bandcamp.com/album/oran-mor-2020`,
  },
};

export const Pixiv: Story = {
  ...Empty,
  args: {
    editable: true,
    embedUrl: `https://www.pixiv.net/en/artworks/83682624`,
  },
};

export const ViewOnlyPixiv: Story = {
  ...Empty,
  args: {
    ...Pixiv.args,
    editable: false,
  },
};

export const SpoileredPixiv: Story = {
  args: {
    editable: false,
    embedUrl: Pixiv.args?.embedUrl,
  },
  render: (args) => (
    <QueryClientProvider client={queryClient}>
      <Editor
        {...args}
        initialContent={
          args.embedUrl
            ? `<article data-type="oembed" data-src="${args.embedUrl}" data-spoilers="true" />`
            : args.initialContent
        }
      />
    </QueryClientProvider>
  ),
};

export const Tumblr: Story = {
  ...Empty,
  args: {
    editable: true,
    embedUrl: `https://bobaboard.tumblr.com/post/647298900927053824/this-april-1st-bobaboard-is-proud-to-bring-its`,
  },
};

export const Twitter: Story = {
  ...Empty,
  args: {
    editable: true,
    embedUrl: `https://twitter.com/Horse_ebooks/status/218439593240956928`,
  },
};

export const SpoileredTwitter: Story = {
  ...SpoileredPixiv,
  args: {
    ...SpoileredPixiv.args,
    embedUrl: Twitter.args?.embedUrl,
  },
};

export const TikTok: Story = {
  ...Empty,
  args: {
    editable: true,
    embedUrl: `https://www.tiktok.com/@scout2015/video/6718335390845095173`,
  },
};

export const Instagram: Story = {
  ...Empty,
  args: {
    editable: true,
    embedUrl: `https://www.instagram.com/p/89CUyVoVY9/`,
  },
};

export const Reddit: Story = {
  ...Empty,
  args: {
    editable: true,
    embedUrl: `https://www.reddit.com/r/nextfuckinglevel/comments/ibikdr/50_year_old_firefighter_deadlifts_600_lbs_of/`,
  },
};

export const YouTube: Story = {
  ...Empty,
  args: {
    editable: true,
    embedUrl: `https://www.youtube.com/watch?v=k1BneeJTDcU`,
  },
};

export const Vimeo: Story = {
  ...Empty,
  args: {
    editable: true,
    embedUrl: `https://vimeo.com/584232458`,
  },
};

export const Image: Story = {
  ...Empty,
  args: {
    editable: true,
    embedUrl: `https://tanoshimi.xyz/2016/11/29/yes-sadpanda-is-one-of-my-sources/`,
  },
};
