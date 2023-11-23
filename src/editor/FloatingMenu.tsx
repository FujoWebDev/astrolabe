import { AddMediaImage, Code, GifFormat, Www } from "iconoir-react";
import { MenuButtonProps, MenuOption, MenuOptionsProps } from "./BubbleMenu";
import React, { forwardRef, useId, useRef, useState } from "react";

const handleFileLoadRequest = (
  callback: (loadPromise: Promise<string | ArrayBuffer>) => void
) => {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (fileInput.files != null && fileInput.files[0] != null) {
      const reader = new FileReader();
      callback(
        new Promise((resolve, reject) => {
          reader.onload = (e) => {
            if (!e.target?.result) {
              return;
            }
            resolve(e.target.result);
            fileInput.value = "";
          };
          reader.onerror = (e) => {
            reject();
          };
        })
      );
      reader.readAsDataURL(fileInput.files[0]);
    }
  };
};

export const ImageButton = ({ editor }: MenuButtonProps) => {
  const id = useId();
  return (
    <>
      <input
        id={id}
        title="Add Image from File"
        style={{
          width: 0,
          height: 0,
        }}
        onChange={handleFileLoadRequest(async (fileLoadPromise) => {
          // TODO: we probably want to move this down to the plugin itself and use react-query for
          // the loading
          const loadedPromise = await fileLoadPromise;
          // TODO: figure out ArrayBuffer type
          editor.commands.setImage({
            // @ts-ignore
            src: loadedPromise,
          });
        })}
        type="file"
        accept="image/png, image/gif, image/jpeg, image/bmp, image/x-icon"
      />
      <label htmlFor={id}>
        <AddMediaImage aria-label="add image from file" />
      </label>
    </>
  );
};

export const OEmbedButton = ({ editor }: MenuButtonProps) => {
  return (
    <button
      title="Add Embed"
      aria-label="add embed"
      onClick={() => {
        const url = window.prompt("Gimme a URL to embed");
        if (url) {
          editor.commands.addOEmbed({
            // OEmbeds to check:
            // https://docs.bobaboard.com/
            // https://tanoshimi.xyz/2016/11/29/yes-sadpanda-is-one-of-my-sources/
            // https://thetwilightsad.bandcamp.com/album/oran-mor-2020
            src: url,
          });
        } else {
          editor.commands.focus();
        }
      }}
    >
      <Www />
    </button>
  );
};

const floatingMenuButtons = new Map<string, React.FC<MenuButtonProps>>();
floatingMenuButtons.set("image", ImageButton);
floatingMenuButtons.set("oembed", OEmbedButton);

export const FloatingMenuOptions = ({
  editor,
  extensions,
  customButtons,
}: MenuOptionsProps) => {
  const buttonMap = new Map(floatingMenuButtons);
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
