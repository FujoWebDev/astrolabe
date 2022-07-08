import { ComponentMeta, ComponentStory } from "@storybook/react";

import CodeMirror from "@uiw/react-codemirror";
import { Editor } from "../src/Editor";
import React from "react";
import ReactJsonView from "react-json-view";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { html } from "@codemirror/lang-html";
import htmlParsers from "prettier/parser-html";
import prettier from "prettier/standalone";

type EventDataFromProps<T, U extends string> = T extends Record<
  U,
  (props: infer V) => any
>
  ? V
  : never;
type EventHandlerData<T, U extends string> = T extends (props: infer V) => any
  ? EventDataFromProps<V, U>
  : any;

const formatHtml = (html: string) => {
  return prettier.format(
    html
      // linebreaks preceeded by text (that is not a closing tag) should break
      // on their own line
      .replaceAll(/[^>]<br( \/)?>/g, "\n<br />\n")
      // linebreaks followed by text (that is not an opening tag) should move
      // the text to the following line
      .replaceAll(/<br( \/)?>[^<]/g, "<br />\n"),
    {
      parser: "html",
      plugins: [htmlParsers],
    }
  );
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Editor",
  component: Editor,
  decorators: [
    (Story, ctx) => {
      const [currentContent, setCurrentContent] =
        React.useState<EventHandlerData<typeof Editor, "onContentChange">>();
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              maxWidth: "500px",
              width: "40%",
              backgroundColor: "antiquewhite",
            }}
          >
            <Story
              args={{
                ...ctx.args,
                onContentChange: setCurrentContent,
              }}
            />
          </div>
          <div>
            <CodeMirror
              value={
                currentContent ? formatHtml(currentContent.html.trim()) : ""
              }
              height="200px"
              extensions={[html()]}
              theme={dracula}
              editable={false}
            />
          </div>
          <div>
            <ReactJsonView src={currentContent ? currentContent.json : {}} />
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
