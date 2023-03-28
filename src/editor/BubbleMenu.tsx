// testing ssh again 4
// icons not available: strikethrough, headings, clear formatting
import {
  Code,
  EyeOff,
  Link,
  List,
  NumberedListLeft,
  Quote,
  Underline,
} from "iconoir-react";
import { Mark, Node } from "@tiptap/core";

import type { Editor } from "@tiptap/react";
import React from "react";

export interface MenuOptionsProps {
  editor: Editor;
  extensions: (Node<any, any> | Mark<any, any>)[];
  customButtons?: MenuOption[];
}

export interface MenuOption {
  extensionName: string;
  menuButton: React.FC<MenuButtonProps>;
}

export interface MenuButtonProps {
  editor: Editor;
}

export const BoldButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="bold"
      aria-label="bold"
      aria-pressed={editor.isActive("bold")}
      onClick={() => editor.chain().focus().toggleBold().run()}
    >
      <strong>B</strong>
    </button>
  );
};

export const ItalicButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="italic"
      aria-label="italic"
      aria-pressed={editor.isActive("italic")}
      //@ts-ignore ts gives an error for commands that have not been imported somewhere in the editor package,
      // but the command works fine with in Storybook with the extension being imported there and passed as a prop to the editor.
      onClick={() => editor.chain().focus().toggleItalic().run()}
    >
      <em>I</em>
    </button>
  );
};

// TODO: make sure only one button but include with any code extension
export const CodeButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="Code"
      aria-label="code"
      aria-pressed={editor.isActive("code") || editor.isActive("codeBLock")}
      onClick={() => {
        if (editor.isActive("codeBLock")) {
          //@ts-ignore
          editor.chain().focus().toggleCodeBlock().run();
          return;
        }
        //@ts-ignore
        editor.chain().focus().toggleCode().run();
      }}
    >
      <Code />
    </button>
  );
};

export const LinkButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title={editor.isActive("link") ? "Edit link" : "Add link"}
      aria-label={editor.isActive("link") ? "Edit link" : "Add link"}
      aria-pressed={editor.isActive("link")}
      onClick={() => {
        const prevUrl = editor.getAttributes("link").href;
        const url = window.prompt("Gimme a URL to link", prevUrl);
        // cancelled
        if (url === null) {
          editor.commands.focus();
          return;
        }

        // empty
        if (url === "") {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          return;
        }

        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
      }}
    >
      <Link />
      {editor.isActive("link") && (
        <span> : {editor.getAttributes("link").href}</span>
      )}
    </button>
  );
};

const bubbleMenuButtons = new Map<string, React.FC<MenuButtonProps>>();
bubbleMenuButtons.set("bold", BoldButton);
bubbleMenuButtons.set("italic", ItalicButton);

export const BubbleMenuOptions = ({
  editor,
  extensions,
  customButtons,
}: MenuOptionsProps) => {
  const buttonMap = new Map(bubbleMenuButtons);
  if (customButtons?.length) {
    customButtons.forEach((customButton) => {
      buttonMap.set(customButton.extensionName, customButton.menuButton);
    });
  }
  const options = extensions
    .map((extension) => {
      if (buttonMap.has(extension.name)) {
        return {
          extensionName: extension.name,
          menuButton: buttonMap.get(extension.name),
        };
      }
    })
    .filter((option): option is MenuOption => !!option);
  return (
    <ul role="menubar">
      {options.map((option) => (
        <li key={option.extensionName} role="menuitem">
          <option.menuButton editor={editor} />
        </li>
      ))}
    </ul>
  );
};
