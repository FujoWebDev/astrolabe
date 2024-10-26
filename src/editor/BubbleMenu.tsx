// icons not available: strikethrough, headings, clear formatting
import {
  Code,
  CodeBracketsSquare,
  EyeClosed,
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
      title="Bold"
      aria-label="Bold"
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
      title="Italic"
      aria-label="Italic"
      aria-pressed={editor.isActive("italic")}
      //@ts-ignore ts gives an error for commands that have not been imported somewhere in the editor package,
      // but the command works fine in Storybook with the extension being imported there and passed as a prop to the editor.
      onClick={() => editor.chain().focus().toggleItalic().run()}
    >
      <em>I</em>
    </button>
  );
};

export const UnderlineButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="Underline"
      aria-label="Underline"
      aria-pressed={editor.isActive("underline")}
      //@ts-ignore
      onClick={() => editor.chain().focus().toggleUnderline().run()}
    >
      <Underline />
    </button>
  );
};

export const StrikeButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="Strikethrough"
      aria-label="strikethrough"
      aria-pressed={editor.isActive("strike")}
      //@ts-ignore
      onClick={() => editor.chain().focus().toggleStrike().run()}
    >
      <s>S</s>
    </button>
  );
};

export const BlockquoteButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="Block Quote"
      aria-label="block quote"
      aria-pressed={editor.isActive("blockquote")}
      //@ts-ignore
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
    >
      <Quote />
    </button>
  );
};

// TODO: Maybe add controls for list item sinking/lifting/splitting functionality to list buttons?
export const BulletListButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="Bullet List"
      aria-label="bullet list"
      aria-pressed={editor.isActive("bulletList")}
      //@ts-ignore
      onClick={() => editor.chain().focus().toggleBulletList().run()}
    >
      <List />
    </button>
  );
};

// TODO: Maybe add controls for list item sinking/lifting/splitting functionality to list buttons?
export const OrderedListButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="Numbered List"
      aria-label="numbered list"
      aria-pressed={editor.isActive("orderedList")}
      //@ts-ignore
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
    >
      <NumberedListLeft />
    </button>
  );
};

// TODO: probably needs better UI, heading should probably be a select of something instead of a bunch of buttons
const HeadingButton = ({
  level,
  editor,
}: {
  level: number;
  editor: Editor;
}) => {
  return (
    <button
      title={`Heading ${level}`}
      aria-label={`heading ${level}`}
      aria-pressed={editor.isActive("heading", { level: level })}
      onClick={() =>
        //@ts-ignore
        editor.chain().focus().toggleHeading({ level: level }).run()
      }
      //@ts-ignore
      hidden={!editor.can().toggleHeading({ level: level })}
    >
      <span>{`H${level}`}</span>
    </button>
  );
};

export const HeadingButtons = ({ editor }: MenuButtonProps) => {
  const headingLevels = [1, 2, 3, 4, 5, 6];
  return (
    <>
      {headingLevels.map((level) => (
        <HeadingButton key={level} level={level} editor={editor} />
      ))}
    </>
  );
};

export const InlineSpoilersButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="text spoilers"
      aria-label="text spoilers"
      aria-pressed={editor.isActive("inlineSpoilers")}
      onClick={() => editor.chain().focus().toggleInlineSpoilers().run()}
    >
      <EyeClosed />
    </button>
  );
};

export const CodeButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="Code"
      aria-label="code"
      aria-pressed={editor.isActive("code")}
      onClick={() => {
        //@ts-ignore
        editor.chain().focus().toggleCode().run();
      }}
    >
      <Code />
    </button>
  );
};

export const CodeBlockButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="Code Block"
      aria-label="code block"
      aria-pressed={editor.isActive("codeBLock")}
      onClick={() => {
        //@ts-ignore
        editor.chain().focus().toggleCodeBlock().run();
      }}
    >
      <CodeBracketsSquare />
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
          // for some reason the extendMarkRange here doesn't seem to work, even though it does in the link updating below?
          // @ts-ignore
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          return;
        }

        const preppedUrl = url.trim().startsWith("http")
          ? url.trim()
          : "https://" + url.trim();
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          // @ts-ignore
          .setLink({ href: preppedUrl })
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

// We don't add this one to the map since it's not for a specific extension
export const ClearButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="Clear Formatting"
      aria-label="clear formatting"
      onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
    >
      <span>Clear Formatting</span>
    </button>
  );
};

const bubbleMenuButtons = new Map<string, React.FC<MenuButtonProps>>();
bubbleMenuButtons.set("bold", BoldButton);
bubbleMenuButtons.set("italic", ItalicButton);
bubbleMenuButtons.set("underline", UnderlineButton);
bubbleMenuButtons.set("strike", StrikeButton);
bubbleMenuButtons.set("inlineSpoilers", InlineSpoilersButton);
bubbleMenuButtons.set("link", LinkButton);
bubbleMenuButtons.set("code", CodeButton);
bubbleMenuButtons.set("codeBlock", CodeBlockButton);
bubbleMenuButtons.set("blockquote", BlockquoteButton);
bubbleMenuButtons.set("bulletList", BulletListButton);
bubbleMenuButtons.set("orderedList", OrderedListButton);
bubbleMenuButtons.set("heading", HeadingButtons);

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
      {options.length > 0 && (
        <li role="menuitem">
          <ClearButton editor={editor} />
        </li>
      )}
    </ul>
  );
};
