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

// export interface ImageSearchBoxProps {
//   onDialogClose: () => void;
// }

// // TODO: make generic and figure out props
// export const ImageSearchBox = forwardRef<
//   HTMLDialogElement,
//   ImageSearchBoxProps
// >((props, ref) => {
//   const [imageResults, setImageResults] = useState<Record<string, any>[]>([]);
//   const [autocompleteResponses, setAutocompleteResponses] = useState<string[]>(
//     []
//   );
//   const [moreResults, setMoreResults] = useState<boolean>(false);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const previewsListId = useId();
//   const autocompleteListId = useId();
//   return (
//     <dialog
//       ref={ref}
//       onClose={() => {
//         props.onDialogClose();
//         if (inputRef.current) {
//           inputRef.current.value = "";
//         }
//         setImageResults([]);
//         setAutocompleteResponses([]);
//         setMoreResults(false);
//       }}
//     >
//       <label>
//         Search GIFs:
//         <input
//           ref={inputRef}
//           placeholder="Search Tenor"
//           aria-controls={previewsListId + " " + autocompleteListId}
//         ></input>
//       </label>
//       <ul
//         id={autocompleteListId}
//         className="gif-autocomplete"
//         aria-label="GIF search autocomplete"
//       >
//         {autocompleteResponses.map((response) => (
//           <li key={response}>
//             <button>{response}</button>
//           </li>
//         ))}
//       </ul>
//       <ul
//         id={previewsListId}
//         className="gif-previews"
//         aria-label="GIF Previews"
//       >
//         {imageResults.map((result) => (
//           <li key={result.id}>
//             <button>
//               <img src={result.media_formats.nanogif.url}></img>
//             </button>
//           </li>
//         ))}
//       </ul>
//       {moreResults && <button>Load More Results</button>}
//     </dialog>
//   );
// });

// export const GifSearchButton = ({ editor }: MenuButtonProps) => {
//   const dialogRef = useRef<HTMLDialogElement>(null);
//   return (
//     <>
//       <button
//         title="Search for GIF"
//         aria-label="search for GIF"
//         onClick={() => {
//           dialogRef.current?.show();
//         }}
//       >
//         <GifFormat />
//       </button>
//       <ImageSearchBox
//         ref={dialogRef}
//         onDialogClose={() => {
//           editor.commands.focus();
//         }}
//       />
//     </>
//   );
// };

const floatingMenuButtons = new Map<string, React.FC<MenuButtonProps>>();
floatingMenuButtons.set("image", ImageButton);
// floatingMenuButtons.set("gifSearch", GifSearchButton);
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
