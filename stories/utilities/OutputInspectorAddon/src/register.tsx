import { JSONContent, generateHTML } from "@tiptap/core";
import { addons, types } from "@storybook/addons";

import { AddonPanel } from "@storybook/components";
import CodeMirror from "@uiw/react-codemirror";
import { OutputInspector } from "./OutputInspector";
// import { EXTENSIONS } from "../src/Editor";
import ReactJsonView from "react-json-view";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { html } from "@codemirror/lang-html";
import htmlParsers from "prettier/parser-html";
import prettier from "prettier/standalone";
import { useGlobals } from "@storybook/api";

addons.register("output-inspector", () => {
  addons.add("output-inspector/panel", {
    title: "Output Inspector",
    //👇 Sets the type of UI element in Storybook
    type: types.PANEL,
    render: ({ active, key }) => {
      return (
        <AddonPanel key={key} active={!!active}>
          <OutputInspector />
        </AddonPanel>
      );
    },
    paramKey: "outputInspector",
  });
});
