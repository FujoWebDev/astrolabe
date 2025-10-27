import type { Extensions } from "@tiptap/react";
import type {
  EDITOR_VIEWS_PANEL_UPDATE,
  EDITOR_VIEWS_UPDATE,
} from "./constants";
import "@storybook/react-vite";

declare module "@storybook/react-vite" {
  interface Parameters {
    editorTreeViewer?: {
      editorTreeViews: EditorTreeViewConfig[];
      // By default, this will use the starter kit as initial plugins,
      // but it can be overridden by passing this
      initialPlugins?: Extensions[];
    };
  }
}

export type EditorTreeView =
  | {
      // For JSON objects, like lexicons or prosemirror schemas
      type: "json";
      content: Record<string, unknown>;
    }
  | {
      // For more classic text types
      type: "text" | "markdown";
      content: string;
    }
  | {
      // For displaying step-by-step data, like with Playwright
      type: "table";
      content: {
        headers?: string[];
        rows: string[][];
      };
    }
  | {
      type: "loading";
      content?: string;
    }
  | {
      type: "error";
      content: string;
    };

export type EditorTreeViewConfig = {
  id: string;
  label: string;
  compute: (context: {
    editorJson: Record<string, unknown> | null;
  }) => Promise<EditorTreeView>;
};

export interface EditorTreeViewEvents {
  [EDITOR_VIEWS_UPDATE]?: {
    views: (Omit<EditorTreeViewConfig, "compute"> & EditorTreeView)[];
    updatedAt: number;
  };
  [EDITOR_VIEWS_PANEL_UPDATE]?: (_: { active: boolean }) => void;
}
