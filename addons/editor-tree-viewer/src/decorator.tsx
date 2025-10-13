import React, { useState } from "react";
import { useChannel, makeDecorator } from "storybook/preview-api";
import {
  EditorContent,
  EditorContext,
  useEditor,
  type EditorEvents,
} from "@tiptap/react";

import {
  EDITOR_VIEWS_PANEL_ACTIVE,
  EDITOR_VIEWS_PANEL_UPDATE,
  EDITOR_VIEWS_UPDATE,
} from "./constants.js";
import type { EditorTreeViewEvents } from "./types.js";
import StarterKit from "@tiptap/starter-kit";
// import { BubbleMenu } from "@tiptap/react/menus";
export { type EditorTreeViewConfig } from "./types.js";

export const withEditorTreeViewer = makeDecorator({
  name: "withEditorTreeViewer",
  parameterName: "editorTreeViewer",
  skipIfNoParametersOrOptions: true,
  wrapper: (getStory, context) => {
    const [panelActive, setPanelActive] = useState(
      // We take the initial state from localStorage since there's no guarantee
      // the panel will get to call the "update active state" function at the
      // right moment.
      Boolean(localStorage.getItem(EDITOR_VIEWS_PANEL_ACTIVE))
    );
    const editor = useEditor({
      immediatelyRender: false,
      // https://tiptap.dev/docs/guides/performance#gain-more-control-over-rendering
      shouldRerenderOnTransaction: false,
      extensions: [
        ...(context.parameters.editorTreeViewer?.initialPlugins ?? [
          StarterKit,
        ]),
        ...(context.args.plugins ?? []),
      ],
      onCreate: ({ editor }) => {
        emitViews({ editor });
      },
      content: context.args.initialText,
      editable: context.args.editable,
    });

    const emit = useChannel({
      [EDITOR_VIEWS_PANEL_UPDATE]: ({ active }) => {
        setPanelActive(active);
      },
    } satisfies EditorTreeViewEvents);

    const { editorTreeViews } = context.parameters.editorTreeViewer ?? {};
    const emitViews = React.useCallback(
      async ({ editor }: EditorEvents["update" | "create"]) => {
        if (!editorTreeViews || !panelActive) {
          return;
        }
        const editorJson = editor.getJSON();

        emit(EDITOR_VIEWS_UPDATE, {
          updatedAt: Date.now(),
          views: await Promise.all(
            editorTreeViews.map(async (view) => {
              try {
                return {
                  id: view.id,
                  label: view.label,
                  ...(await view.compute({ editorJson })),
                };
              } catch (e) {
                console.error("There was an error computing the view");
                console.error(e);
                return {
                  id: view.id,
                  label: view.label,
                  type: "error",
                  content: `There was an error computing the view: ${e}`,
                };
              }
            })
          ),
        } satisfies EditorTreeViewEvents[typeof EDITOR_VIEWS_UPDATE]);
      },
      [editorTreeViews, emit, panelActive]
    );

    React.useEffect(() => {
      editor?.on("update", emitViews);
      editor?.on("create", emitViews);

      return () => {
        editor?.off("update", emitViews);
        editor?.off("create", emitViews);
      };
    }, [emitViews, editor]);

    return (
      <>
        <EditorContext.Provider value={{ editor }}>
          {getStory(context) as React.ReactNode}
          {/* {!!editor?.isEditable && (
            <BubbleMenu>
              <button>Add Link</button>
            </BubbleMenu>
          )} */}
          <EditorContent
            className="astrolabe-editor"
            editor={editor}
            role="presentation"
          />
        </EditorContext.Provider>
      </>
    );
  },
});

export default withEditorTreeViewer;
