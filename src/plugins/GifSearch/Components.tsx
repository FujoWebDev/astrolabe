import { GifSearchResponse, GifSearchResponseObject } from "./Plugin";
import React, { forwardRef, useId, useRef, useState } from "react";

import { Editor } from "@tiptap/react";
import { GifFormat } from "iconoir-react";

export interface GifSearchBoxProps {
  onDialogClose: () => void;
  onClickClose: () => void;
  onUserInput: (
    searchTerm: string,
    onGifSearch: (responses: GifSearchResponse) => void
  ) => void;
  onSelectImage: (response: GifSearchResponseObject) => void;
}

export const GifSearchBox = forwardRef<HTMLDialogElement, GifSearchBoxProps>(
  (props, ref) => {
    const [imageResults, setImageResults] = useState<GifSearchResponseObject[]>(
      []
    );
    const [searchTerm, setSearchTerm] = useState("");
    // const [autocompleteResponses, setAutocompleteResponses] = useState<string[]>(
    //   []
    // );
    const [moreResults, setMoreResults] = useState<boolean>(false);
    const previewsListId = useId();
    // const autocompleteListId = useId();
    return (
      <dialog
        ref={ref}
        className="gif-search-popup"
        onClose={() => {
          props.onDialogClose();
          setSearchTerm("");
          setImageResults([]);
          setMoreResults(false);
        }}
      >
        <button onClick={props.onClickClose}>Close</button>
        <label>
          Search GIFs:
          <input
            placeholder="Search Tenor"
            aria-controls={previewsListId}
            value={searchTerm}
            onChange={(e) => {
              const query = e.currentTarget.value;
              setSearchTerm(query);
              props.onUserInput(query, (response) => {
                setImageResults(response.results);
                if (response.next) {
                  setMoreResults(true);
                } else {
                  setMoreResults(false);
                }
              });
              if (!query) {
                setImageResults([]);
                setMoreResults(false);
              }
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
                  console.log("result image clicked");
                  props.onSelectImage(result);
                  props.onClickClose();
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
              props.onUserInput(searchTerm, (response) => {
                setImageResults((prev) => [...prev, ...response.results]);
                if (response.next) {
                  setMoreResults(true);
                } else {
                  setMoreResults(false);
                }
              });
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
        onDialogClose={() => {
          editor.commands.resetGifSearchState();
        }}
        onUserInput={(
          searchTerm: string,
          onGifSearch: (responses: GifSearchResponse) => void
        ) => {
          editor.commands.searchGifs(searchTerm, onGifSearch);
        }}
        onSelectImage={(response) => {
          console.log("setting gif");
          editor.commands.setGif(response);
        }}
        onClickClose={() => {
          console.log("closing dialog");
          dialogRef.current?.close();
        }}
      />
    </>
  );
};
