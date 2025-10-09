import React from "react";
import { useAddonState, useChannel } from "storybook/manager-api";

import { EDITOR_VIEWS_UPDATE, EDITOR_VIEWS_STATE_KEY } from "./constants.js";

import type { EditorTreeViewEvents } from "./types.js";
import { TreeView } from "./TreeView.js";

type EditorTreeViewState = NonNullable<
  EditorTreeViewEvents[typeof EDITOR_VIEWS_UPDATE]
>;

export const Panel: React.FC<{ active: boolean }> = ({ active }) => {
  const [state, setState] = useAddonState<EditorTreeViewState | null>(
    EDITOR_VIEWS_STATE_KEY,
    null
  );

  useChannel({
    [EDITOR_VIEWS_UPDATE]: (payload: EditorTreeViewState) => {
      setState(payload);
    },
  });

  if (!active) {
    return null;
  }

  if (!state || state.views.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          color: "#666",
          fontFamily: "var(--font-family-sans, sans-serif)",
        }}
      >
        No editor views available. Add a `parameters.editorTreeViews` in your
        story to populate this panel.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        display: "grid",
        gridTemplateColumns: `repeat(${state.views.length}, 1fr)`,
        gap: "16px",
      }}
    >
      {state.views.map((view) => (
        <section
          key={view.id}
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <header
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #f0f0f0",
              background: "rgb(41, 44, 46)",
              fontWeight: 600,
              fontSize: "13px",
              fontFamily: "var(--font-family-sans, sans-serif)",
            }}
          >
            {view.label}
          </header>
          <div style={{ maxHeight: "35vh", overflow: "auto", flexGrow: "1" }}>
            <TreeView {...view} />
          </div>
        </section>
      ))}
      <style>
        {`
          .h-full {
            height: 100%;
          }
        `}
      </style>
    </div>
  );
};
