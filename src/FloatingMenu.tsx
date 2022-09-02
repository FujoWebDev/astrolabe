import { AddMediaImage, Twitter, Www } from "iconoir-react";

import type { Editor } from "@tiptap/react";
import React from "react";

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

export const FloatingMenuOptions = ({ editor }: { editor: Editor }) => {
  return (
    <ul role="menubar">
      <li role="menuitem">
        <input
          // TODO: figure out how to namespace this id in case there are multiple editors on the page
          id="add-image"
          title="Add an image to the editor"
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
        <label htmlFor="add-image">
          <AddMediaImage />
        </label>
      </li>
      <li role="menuitem">
        <button
          title="Add tweet"
          onClick={() =>
            editor.commands.addTweet({
              src: "https://twitter.com/horse_ebooks/status/218439593240956928",
            })
          }
        >
          <Twitter />
        </button>
      </li>
      <li role="menuitem">
        <button
          title="Add embed"
          onClick={() =>
            editor.commands.addOEmbed({
              // TODO: other OEmbeds to check:
              // https://tanoshimi.xyz/2016/11/29/yes-sadpanda-is-one-of-my-sources/
              // https://thetwilightsad.bandcamp.com/album/oran-mor-2020
              src: "https://docs.bobaboard.com/",
            })
          }
        >
          <Www />
        </button>
      </li>
    </ul>
  );
};
