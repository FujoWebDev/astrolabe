import { DEFAULT_EXTENSIONS, Editor } from "../../src/editor";
import { Meta, StoryObj } from "@storybook/react";

import { BlockWithMenuPlugin } from "@bobaboard/tiptap-block-with-menu";
import Blockquote from "@tiptap/extension-blockquote";
import BulletList from "@tiptap/extension-bullet-list";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Heading from "@tiptap/extension-heading";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import { MenuButtonProps } from "../../src/editor/BubbleMenu";
import OrderedList from "@tiptap/extension-ordered-list";
import React from "react";
import Strike from "@tiptap/extension-strike";
import Underline from "@tiptap/extension-underline";
// import { withContentChangeHandler } from "@bobaboard/tiptap-storybook-inspector";

// We use const meta = {...} as Meta<typeof Component> instead of const meta:Meta<typeof Component> = {...} as shown in the CSF3 docs
// because in the second case the typing becomes too specific to work with the generics in the DecoratorFunction type of withContentChangeHandler
// More on the CSF3 story format: https://storybook.js.org/docs/7.0/react/api/csf
const meta = {
  title: "Editor",
  component: Editor,
  tags: ["autodocs"],
  decorators: [
    // withContentChangeHandler([
    //   ...DEFAULT_EXTENSIONS,
    //   Italic,
    //   ListItem,
    //   Blockquote,
    //   BulletList,
    //   Code,
    //   CodeBlock,
    //   Heading,
    //   OrderedList,
    //   Strike,
    //   Underline,
    //   BlockWithMenuPlugin,
    // ]),
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
    addedExtensions: [Italic],
    initialContent: `<picture data-type="image"><img src="https://placekitten.com/200/300" /></picture>`,
  },
};

export const ViewOnly: Story = {
  args: {
    ...Editable.args,
    editable: false,
  },
};

export const ViewOnlyImagesSpoilers: Story = {
  args: {
    ...ViewOnly.args,
    initialContent: `<picture data-type="image"><img src="https://placekitten.com/200/300" /></picture><picture data-type="image" data-spoilers="true"><img src="https://placekitten.com/200/300" alt="A kitten" /></picture><picture data-type="image" data-spoilers="true" data-width="200" data-height="300"><img src="https://placekitten.com/200/300" alt="A kitten" /></picture>`,
  },
};

export const Italics: Story = {
  args: {
    ...Editable.args,
    initialContent: `<p>but what if I'm <strong>really</strong>, <em>really</em>, <strong><em>really</em></strong> excited!!!</p>`,
    addedExtensions: [Italic],
    customBubbleMenuButtons: [
      {
        extensionName: "italic",
        menuButton: ({ editor }: MenuButtonProps) => {
          return (
            <button
              title="italic"
              aria-label="italic"
              aria-pressed={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <em>Italic</em>
            </button>
          );
        },
      },
    ],
  },
};

export const BlockWithMenu: Story = {
  args: {
    ...Editable.args,
    // The first of the divs here intentionally leaves out data-width and data-height for testing purposes,
    // and therefore will appear with no size on load, only the menu will show for the block.
    initialContent: `<div data-type="blockWithMenu" data-spoilers="true"></div><div data-type="blockWithMenu" data-height="100" data-width="800"></div>`,
    addedExtensions: [BlockWithMenuPlugin],
    customFloatingMenuButtons: [
      {
        extensionName: "blockWithMenu",
        menuButton: ({ editor }: MenuButtonProps) => {
          return (
            <button
              title="add block"
              aria-label="add block"
              onClick={() => editor.chain().focus().setBlock({}).run()}
            >
              Block
            </button>
          );
        },
      },
    ],
  },
};

export const ViewOnlyBlocks: Story = {
  args: {
    ...BlockWithMenu.args,
    editable: false,
    initialContent: `<div data-type="blockWithMenu" data-spoilers="true" data-height="300" data-width="300"></div><div data-type="blockWithMenu" data-height="100" data-width="800"></div><p>or if I'm worried about revealing <span data-type="inlineSpoilers">SPOILERS!!!</span> for a thing</p>`,
  },
};

export const Link: Story = {
  args: {
    ...Editable.args,
    initialContent: `<p>and if I want to <a href="https://bobaboard.com/">link</a> to a thing</p>`,
  },
};

export const ViewOnlyLink: Story = {
  args: {
    ...Link.args,
    editable: false,
  },
};

export const InlineSpoilers: Story = {
  args: {
    ...Editable.args,
    initialContent: `<p>or if I'm worried about revealing <span data-type="inlineSpoilers">SPOILERS!!!</span> for a thing</p>`,
  },
};

export const ViewOnlyInlineSpoilers: Story = {
  args: {
    ...InlineSpoilers.args,
    editable: false,
  },
};

export const LimitedHeadings: Story = {
  args: {
    ...Editable.args,
    addedExtensions: [Heading],
    extensionConfigs: [
      { extensionName: Heading.name, config: { levels: [1, 2] } },
    ],
    initialContent: `<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3><p>Regular paragraph</p>`,
  },
};

export const AllExtensions: Story = {
  args: {
    ...Editable.args,
    addedExtensions: [
      Italic,
      Strike,
      ListItem,
      Underline,
      Blockquote,
      BulletList,
      OrderedList,
      Code,
      CodeBlock,
      Heading,
    ],
    initialContent: `<p>but what if I'm <strong>really</strong>, <em>really</em>, <strong><em>really</em></strong> <u>excited</u>!!! (or <s>not</s>)</p><p>and if I want to <a href="https://bobaboard.com/">link</a> to a thing</p><p>or if I'm worried about revealing <span data-type="inlineSpoilers">SPOILERS!!!</span> for a thing</p><blockquote>or quote a thing</blockquote><h1>or Add a Heading</h1><pre><code>or a code block</code></pre><p>or just a little bit of <code>code</code></p><ol><li>or</li><li>an</li><li>ordered</li><li>list</li></ol><ul><li>or</li><li>an</li><li>unordered</li><li>list</li></ul>`,
  },
};
