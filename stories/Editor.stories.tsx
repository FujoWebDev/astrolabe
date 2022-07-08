import { ComponentMeta, ComponentStory } from "@storybook/react";

import { Editor } from "../src/Editor";
import type { JSONContent } from "@tiptap/core";
import React from "react";
import ReactJsonView from "react-json-view";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Editor",
  component: Editor,
  decorators: [
    (Story, ctx) => {
      const [currentContent, setCurrentContent] = React.useState<JSONContent>();
      return (
        <div style={{ display: "flex" }}>
          <div
            style={{
              maxWidth: "500px",
              width: "40%",
              backgroundColor: "antiquewhite",
            }}
          >
            <Story args={{ ...ctx.args, onTextChange: setCurrentContent }} />
          </div>
          <div>
            <ReactJsonView src={currentContent as object} />
          </div>
        </div>
      );
    },
  ],
} as ComponentMeta<typeof Editor>;

const Template: ComponentStory<typeof Editor> = (args) => <Editor {...args} />;

export const Editable = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Editable.args = {
  editable: true,
};

export const ViewOnly = Template.bind({});
ViewOnly.args = {
  editable: false,
};
