import { AddMediaImage, Code, GifFormat, Www } from "iconoir-react";
// import { MenuButtonProps, MenuOption, any } from "./BubbleMenu";
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

export const ImageButton = ({ editor }: any) => {
  const id = "dfasdfas";
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

export const OEmbedButton = ({ editor }: any) => {
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

// TODO: Implement actual logic (and add button to map) once we have GIF selecting figured out
// export const GifButton = ({ editor }: MenuButtonProps) => {
//   return (
//     <button
//       title="Add GIF"
//       aria-label="add GIF"
//       onClick={() => {

//       }}
//     >
//       <GifFormat />
//     </button>
//   );
// };

const floatingMenuButtons = new Map<string, React.FC<any>>();
floatingMenuButtons.set("image", ImageButton);
floatingMenuButtons.set("oembed", OEmbedButton);

export const FloatingMenuOptions = ({
  editor,
  extensions,
  customButtons,
}: any) => {
  const buttonMap = new Map(floatingMenuButtons);
  if (customButtons?.length) {
    customButtons.forEach((customButton: any) => {
      buttonMap.set(customButton.extensionName, customButton.menuButton);
    });
  }
  const options = extensions
    .map((extension: any) => {
      if (buttonMap.has(extension.name)) {
        return {
          extensionName: extension.name,
          menuButton: buttonMap.get(extension.name),
        };
      }
    })
    .filter((option: any): option is any => !!option);
  return (
    <ul role="menubar">
      {options.map((option: any) => (
        <li key={option.extensionName} role="menuitem">
          <option.menuButton editor={editor} />
        </li>
      ))}
    </ul>
  );
};
