import { ComponentMeta, ComponentStory } from "@storybook/react";

import { Editor } from "../src/Editor";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Editor",
  component: Editor,
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
