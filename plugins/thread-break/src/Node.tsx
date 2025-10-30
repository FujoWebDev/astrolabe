import React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { ThreadBreakPopover } from "./popover.js";

import type { HtmlHTMLAttributes } from "react";
import "./thread-break.css";

declare module "@fujocoded/astrolabe" {
  interface Platforms {
    mastodon: unknown;
    tumblr: unknown;
    bsky: unknown;
    twitter: unknown;
  }
}

export type PlatformKey = "mastodon" | "tumblr" | "bsky" | "twitter";
export type PlatformOptions = Record<string, "skip" | "break">;

export const ALL_PLATFORMS: PlatformKey[] = [
  "mastodon",
  "tumblr",
  "bsky",
  "twitter",
];

export const DEFAULT_BREAK_ON_PLATFORMS: PlatformKey[] = ["bsky", "twitter"];
export const DEFAULT_SKIP_ON_PLATFORMS: PlatformKey[] = ALL_PLATFORMS.filter(
  (platform) => DEFAULT_BREAK_ON_PLATFORMS.includes(platform)
);

/**
 * Parse platform arrays from HTML attribute format (semicolon-separated)
 */
export function parsePlatformsFromHTML(
  value: string | string[] | null | undefined,
  fallback: PlatformKey[] = []
): PlatformKey[] {
  if (!value) {
    return fallback;
  }
  // TODO: figure out why this is an array at times
  if (Array.isArray(value)) {
    return value.map((item) => item.trim() as PlatformKey);
  }
  return value.includes(";")
    ? value
        .split(";")
        .filter(Boolean)
        .map((item) => item.trim() as PlatformKey)
    : [value.trim() as PlatformKey];
}

/**
 * Serialize platform arrays to HTML attribute format (semicolon-separated)
 */
export function serializePlatformsToHTML(
  platforms: PlatformKey[] | null | undefined
): string {
  if (!platforms?.length) {
    return "";
  }
  return platforms.map((platform) => platform.trim()).join(";");
}

export type ThreadBreakOptions = {
  HTMLAttributes: HtmlHTMLAttributes<HTMLDivElement> &
    Partial<{
      "data-astrolb-type": string;
      "data-astrolb-skip-on": PlatformKey[];
      "data-astrolb-break-on": PlatformKey[];
    }>;
  skipOn?: PlatformKey[];
  breakOn?: PlatformKey[];
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    threadBreak: {
      setThreadBreak: (options?: {
        skipOn?: PlatformKey[];
        breakOn?: PlatformKey[];
      }) => ReturnType;
    };
  }
}

// Editable view with popover
function ThreadBreakNodeView({
  node,
  updateAttributes,
  editor,
}: ReactNodeViewProps) {
  // Parse current platform options from node attributes
  const skipOn: PlatformKey[] = parsePlatformsFromHTML(
    node.attrs["data-astrolb-skip-on"],
    DEFAULT_SKIP_ON_PLATFORMS
  );
  const breakOn: PlatformKey[] = parsePlatformsFromHTML(
    node.attrs["data-astrolb-break-on"],
    DEFAULT_BREAK_ON_PLATFORMS
  );

  return (
    <NodeViewWrapper>
      <NodeViewContent
        as="div"
        data-astrolb-type="thread-break"
        role="button"
      />
      <ThreadBreakPopover
        initialSkipOn={skipOn}
        initialBreakOn={breakOn}
        editable={editor.isEditable}
        onChange={(options) =>
          updateAttributes({
            "data-astrolb-skip-on": serializePlatformsToHTML(
              Object.keys(options).filter(
                (key) => options[key as PlatformKey] === "skip"
              ) as PlatformKey[]
            ),
            "data-astrolb-break-on": serializePlatformsToHTML(
              Object.keys(options).filter(
                (key) => options[key as PlatformKey] === "break"
              ) as PlatformKey[]
            ),
          })
        }
      />
    </NodeViewWrapper>
  );
}

export const Plugin = Node.create<ThreadBreakOptions>({
  name: "thread-break",
  group: "block",

  addOptions() {
    return {
      HTMLAttributes: {},
      skipOn: ["mastodon", "tumblr"],
      breakOn: ["bsky", "twitter"],
    };
  },

  addAttributes() {
    return {
      "data-astrolb-skip-on": {
        default: this.options.skipOn,
        parseHTML: (element) =>
          parsePlatformsFromHTML(
            element.dataset.astrolbSkipOn,
            this.options.skipOn
          ),
        renderHTML: (attributes: ThreadBreakOptions["HTMLAttributes"]) => ({
          "data-astrolb-skip-on": serializePlatformsToHTML(
            attributes["data-astrolb-skip-on"] ?? this.options.skipOn
          ),
        }),
      },
      "data-astrolb-break-on": {
        default: this.options.breakOn,
        parseHTML: (element) =>
          parsePlatformsFromHTML(
            element.dataset.astrolbBreakOn,
            this.options.breakOn
          ),
        renderHTML: (attributes: ThreadBreakOptions["HTMLAttributes"]) => ({
          "data-astrolb-break-on": serializePlatformsToHTML(
            attributes["data-astrolb-break-on"] ?? this.options.breakOn
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-astrolb-type='thread-break']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-astrolb-type": this.name,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ThreadBreakNodeView);
  },

  addCommands() {
    return {
      setThreadBreak:
        (options?: { skipOn?: PlatformKey[]; breakOn?: PlatformKey[] }) =>
        ({ commands }) => {
          const skipOn = options?.skipOn ?? this.options.skipOn;
          const breakOn = options?.breakOn ?? this.options.breakOn;
          return commands.insertContent({
            type: this.name,
            attrs: {
              "data-astrolb-skip-on": serializePlatformsToHTML(skipOn),
              "data-astrolb-break-on": serializePlatformsToHTML(breakOn),
            },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.setThreadBreak(),
    };
  },
});
