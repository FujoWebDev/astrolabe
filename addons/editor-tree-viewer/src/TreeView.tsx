import React from "react";
import type { EditorTreeView } from "./types.js";
import { SyntaxHighlighter } from "storybook/internal/components";

export const TreeView = (view: EditorTreeView) => {
  switch (view.type) {
    case "json": {
      return (
        <SyntaxHighlighter
          language="json"
          copyable
          padded
          showLineNumbers
          className="h-full"
        >
          {JSON.stringify(view.content, null, 2)}
        </SyntaxHighlighter>
      );
    }
    case "markdown": {
      return (
        <SyntaxHighlighter language="md" copyable padded className="h-full">
          {view.content}
        </SyntaxHighlighter>
      );
    }
    case "text": {
      return (
        <SyntaxHighlighter language="text" copyable padded className="h-full">
          {view.content}
        </SyntaxHighlighter>
      );
    }
    case "table": {
      return (
        <div style={{ overflowX: "auto", minHeight: "100%" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              {view.content.headers && (
                <tr>
                  {view.content.headers.map((header) => (
                    <th
                      key={header}
                      style={{
                        textAlign: "left",
                        padding: "4px 8px",
                        borderBottom: "1px solid #e0e0e0",
                        fontFamily: "var(--font-family-mono, monospace)",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {view.content.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${rowIndex}-${cellIndex}`}
                      style={{
                        padding: "4px 8px",
                        borderBottom: "1px solid #f0f0f0",
                        fontFamily: "var(--font-family-mono, monospace)",
                        fontSize: "12px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "error": {
      return <div style={{ color: "red" }}>{view.content}</div>;
    }
    default: {
      // @ts-expect-error It's an error because it should never happen
      throw new Error(`Unknown view: ${view.type} (${view.id})`);
    }
  }
};
