import { Mark, Node } from "@tiptap/core";
import React, { JSXElementConstructor } from "react";

import type { Editor } from "@tiptap/react";

export interface BubbleMenuOptionsProps {
  editor: Editor;
  extensions: (Node<any, any> | Mark<any, any>)[];
  customButtons?: MenuOption[];
}

export interface MenuOption {
  extensionName: string;
  menuButton: JSXElementConstructor<MenuButtonProps>;
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

const bubbleMenuButtons = new Map<
  string,
  JSXElementConstructor<MenuButtonProps>
>();
bubbleMenuButtons.set("bold", BoldButton);

export const BubbleMenuOptions = ({
  editor,
  extensions,
  customButtons,
}: BubbleMenuOptionsProps) => {
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
