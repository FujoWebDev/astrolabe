import { GifSearchResponse, GifSearchResponseObject } from "./Plugin";
import React, { forwardRef, useId, useRef, useState } from "react";

import { Editor } from "@tiptap/react";
import { GifFormat } from "iconoir-react";

export interface GifSearchBoxProps {
  imageResults: GifSearchResponseObject[];
  moreResults: boolean;
  onDialogClose: () => void;
  onUserInput: (
    searchTerm: string
    // onGifSearch: (responses: GifSearchResponse) => void
  ) => void;
  onSelectImage: (response: GifSearchResponseObject) => void;
}

export const GifSearchBox = forwardRef<HTMLDialogElement, GifSearchBoxProps>(
  (props, ref) => {
    const { imageResults, moreResults } = props;
    // const [imageResults, setImageResults] = useState<GifSearchResponseObject[]>(
    //   []
    // );
    const [searchTerm, setSearchTerm] = useState("");
    // const [autocompleteResponses, setAutocompleteResponses] = useState<string[]>(
    //   []
    // );
    // const [moreResults, setMoreResults] = useState<boolean>(false);
    const previewsListId = useId();
    // const autocompleteListId = useId();
    return (
      <dialog
        ref={ref}
        onClose={() => {
          props.onDialogClose();
          setSearchTerm("");
        }}
      >
        <label>
          Search GIFs:
          <input
            placeholder="Search Tenor"
            aria-controls={previewsListId}
            value={searchTerm}
            onChange={(e) => {
              const query = e.currentTarget.value;
              setSearchTerm(query);
              props.onUserInput(query);
            }}
          ></input>
        </label>
        {/* <ul
        id={autocompleteListId}
        className="gif-autocomplete"
        aria-label="GIF search autocomplete"
      >
        {autocompleteResponses.map((response) => (
          <li key={response}>
            <button>{response}</button>
          </li>
        ))}
      </ul> */}
        <ul
          id={previewsListId}
          className="gif-previews"
          aria-label="GIF Previews"
        >
          {imageResults.map((result) => (
            <li key={result.id}>
              <button
                onClick={() => {
                  props.onSelectImage(result);
                }}
              >
                <img src={result.media_formats.nanogif.url}></img>
              </button>
            </li>
          ))}
        </ul>
        {moreResults && (
          <button
            onClick={() => {
              props.onUserInput(searchTerm);
            }}
          >
            Load More Results
          </button>
        )}
      </dialog>
    );
  }
);

export const GifSearchButton = ({ editor }: { editor: Editor }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        title="Search for GIF"
        aria-label="search for GIF"
        onClick={() => {
          dialogRef.current?.show();
        }}
      >
        <GifFormat />
      </button>
      <GifSearchBox
        ref={dialogRef}
        imageResults={editor.storage.gifSearch.gifResults}
        moreResults={!!editor.storage.gifSearch.pos}
        onDialogClose={() => {
          editor.chain().focus().resetGifSearchState().run();
        }}
        onUserInput={(
          searchTerm: string
          // onGifSearch: (responses: GifSearchResponse) => void
        ) => {
          editor.commands.searchGifs(searchTerm);
        }}
        onSelectImage={(response) => {
          dialogRef.current?.close();
          editor.chain().focus().setGif(response);
        }}
      />
    </>
  );
};
