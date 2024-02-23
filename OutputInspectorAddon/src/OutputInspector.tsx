import { useEffect, useState } from "react";

import CodeMirror from "@uiw/react-codemirror";
import { JSONContent } from "@tiptap/core";
import ReactJsonView from "react-json-view";
import { addons } from "@storybook/addons";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { html } from "@codemirror/lang-html";
import { useDebouncedCallback } from "use-debounce";

export const OutputInspector = () => {
  const [content, setContent] = useState<{
    json: JSONContent;
    html: string;
  }>();
  const contentCallback = useDebouncedCallback(
    (content) => {
      setContent(content);
    },
    1000,
    { leading: true, trailing: true }
  );
  useEffect(() => {
    addons.getChannel().addListener("CONTENT_UPDATED_CHANNEL", (content) => {
      // TODO: change this with start transition once you can use React 18 in
      // Storybook addons
      contentCallback(content);
    });
  }, []);

  if (!content) {
    return <div>Add content to the editor to see a preview of its output.</div>;
  }
  return (
    <div>
      <div>
        <CodeMirror
          value={content.html}
          height="200px"
          extensions={[html()]}
          theme={dracula}
          editable={false}
        />
      </div>
      <div>
        <ReactJsonView src={content.json} theme="chalk" />
      </div>
    </div>
  );
};
