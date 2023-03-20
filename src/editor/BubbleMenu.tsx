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
