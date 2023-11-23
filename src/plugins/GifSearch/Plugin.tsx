import { ImageOptions, ImagePlugin } from "@bobaboard/tiptap-image";

import { PluginKey } from "prosemirror-state";

export const GifSearchPluginKey = new PluginKey("GifSearchPlugin");

// Pseudo-code from design doc:
// onSearchSelectorRequest<SearchResult>({
//   onSearchRequest: (searchTerm: string) => Promise<SearchResult>,
//   onSelectElement: (selectedElement: searchResult) => void
// }) => {
//   onUserInput((searchTerm) => {
//       const result = await onSearchRequest(searchTerm);
//       displayHTML(() => {
//         return result.map(gifResult =>
//              <img src={gifResult.src} onClick={() => {
//                       onSelectElement(gifResult);
//                  }} />);
//       });
//   });
// }

// export type AutocompleteResponse = string[];
export type GifSearchResponseObject = {
  created: number;
  hasaudio: boolean;
  id: string;
  media_formats: Record<
    string,
    {
      // This is the url we need for the src
      url: string;
      // Width and height of the media in pixels
      dims: number[];
      duration: number;
      size: number;
    }
  >;
  tags: string[];
  title: string;
  content_description: string;
  itemurl: string;
  hascaption: boolean;
  flags: string;
  bg_color: string;
  url: string;
};

export type GifSearchResponse = {
  next: string;
  results: GifSearchResponseObject[];
};

export interface GifSearchOptions {
  tenorAPIKey: string;
  tenorClientKey: string;
  gifResultsPerRequest: number;
  // autocompleteResultsPerRequest: number;
  country: string;
  language: string;
  formats: string;
  // onImageSearchSelectorRequest: (callbacks: {
  //   onSearchRequest: (
  //     searchTerm: string
  //   ) => Promise<
  //     GifSearchResponse
  //     //   & { autocompleteResults: AutocompleteResponse }
  //   >;
  //   onSelectElement: (selectedElement: GifSearchResponseObject) => void;
  // }) => void;
}
export interface GifSearchStorage {
  pos: string | number;
  lastSearch: string;
  gifResults: GifSearchResponseObject[];
  // latestAutocompleteResponse: AutocompleteResponse | null;
  // onImageSearchSelectorRequest: (callbacks: {
  //   onSearchRequest: (searchTerm: string) => Promise<GifSearchResponse>;
  //   onSelectElement: (selectedElement: GifSearchResponseObject) => void;
  // }) => void;
  // onSearchRequest: (searchTerm: string) => Promise<Record<string, any>>;
  // onSelectElement: (selectedElement: Record<string, any>) => void;
}

export const PLUGIN_NAME = "gifSearch";
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [PLUGIN_NAME]: {
      searchGifs: (
        searchTerm: string
        // onGifSearch: (responses: GifSearchResponse) => void
      ) => ReturnType;
      setGif: (response: GifSearchResponseObject) => ReturnType;
      resetGifSearchState: () => ReturnType;
    };
  }
}

export const GifSearchPlugin = ImagePlugin.extend<
  GifSearchOptions,
  GifSearchStorage
>({
  name: PLUGIN_NAME,

  // I don't know how many of the tenor options we want to pass on to the consumer,
  // so included the ones that seemed potentially important to our prospective user base.
  // Others I left out: content filter level (defaults to off), limit aspect ratios,
  // results in random order (defaults to by relevance), return stickers instead of GIFs
  addOptions() {
    return {
      ...this.parent?.(),
      tenorAPIKey: "",
      tenorClientKey: "BEN",
      gifResultsPerRequest: 20,
      autocompleteResultsPerRequest: 5,
      // A two-letter ISO 3166-1 country code.
      country: "US",
      // A language's two-letter ISO 639-1 language code
      language: "en",
      //comma-seperated list of desired media formats to return. Currently we only support formats that can be loaded in an img tag.
      // By default we get the smallest for previews and the full-size for setting the source
      formats: "gif,nanogif",
    };
  },

  addStorage() {
    return {
      pos: "",
      lastSearch: "",
      gifResults: [],
      // latestAutocompleteResponse: null,
      // onImageSearchSelectorRequest: this.options.onImageSearchSelectorRequest,
      // onSearchRequest: async (searchTerm) => {
      //   const searchURL = `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${this.options.tenorAPIKey}&client_key=${this.options.tenorClientKey}&limit=${this.options.gifResultsPerRequest}&country=${this.options.country}&locale=${this.options.language}_${this.options.country}&media_filter=${this.options.formats}`;
      //   return await (await fetch(searchURL)).json();
      // },
      // onSelectElement: (selectedElement) => {},
    };
  },

  addCommands() {
    return {
      setGif:
        (response: GifSearchResponseObject) =>
        ({ commands }) => {
          return commands.setImage({
            src: response.media_formats.gif.url,
            alt: response.content_description,
          });
        },
      resetGifSearchState: () => () => {
        this.storage.pos = "";
        this.storage.lastSearch = "searchTerm";
        this.storage.gifResults = [];
        return true;
      },
      searchGifs:
        (
          searchTerm: string
          // onGifSearch: (responses: GifSearchResponse) => void
        ) =>
        ({ commands }) => {
          // debugger;
          if (searchTerm.length < 1) {
            commands.resetGifSearchState();
          }
          const isGetMoreRequest = !!(
            this.storage.pos && this.storage.lastSearch === searchTerm
          );
          const searchURL = `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${
            this.options.tenorAPIKey
          }&client_key=${this.options.tenorClientKey}&limit=${
            this.options.gifResultsPerRequest
          }&country=${this.options.country}&locale=${this.options.language}_${
            this.options.country
          }&media_filter=${this.options.formats}${
            isGetMoreRequest ? "&pos=" + this.storage.pos.toString() : ""
          }`;
          // const autocompleteURL = `https://tenor.googleapis.com/v2/autocomplete?q=${searchTerm}&key=${this.options.tenorAPIKey}&client_key=${this.options.tenorClientKey}&limit=${this.options.autocompleteResultsPerRequest}&country=${this.options.country}&locale=${this.options.language}_${this.options.country}`;

          (async () => {
            //TODO: Presumably we should actually validate this
            try {
              const response = (await (
                await fetch(searchURL)
              ).json()) as GifSearchResponse;
              console.log("tenor response", response);
              this.storage.pos = response.next;
              this.storage.lastSearch = searchTerm;
              this.storage.gifResults = isGetMoreRequest
                ? [...this.storage.gifResults, ...response.results]
                : response.results;
            } catch (error) {
              console.error(error);
            }
          })();
          return true;
        },
      // searchGifs: () => () => {

      //   this.options.onImageSearchSelectorRequest({
      //     onSearchRequest: async (searchTerm) => {
      //       const searchURL = `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${
      //         this.options.tenorAPIKey
      //       }&client_key=${this.options.tenorClientKey}&limit=${
      //         this.options.gifResultsPerRequest
      //       }&country=${this.options.country}&locale=${this.options.language}_${
      //         this.options.country
      //       }&media_filter=${this.options.formats}${
      //         this.storage.pos && this.storage.lastSearch === searchTerm
      //           ? "&pos=" + this.storage.pos.toString()
      //           : ""
      //       }`;
      //       // const autocompleteURL = `https://tenor.googleapis.com/v2/autocomplete?q=${searchTerm}&key=${this.options.tenorAPIKey}&client_key=${this.options.tenorClientKey}&limit=${this.options.autocompleteResultsPerRequest}&country=${this.options.country}&locale=${this.options.language}_${this.options.country}`;

      //       //TODO: Presumably we should actually validate this
      //       const response = await (await fetch(searchURL)).json() as GifSearchResponse;
      //       this.storage.pos = response.next;
      //       this.storage.lastSearch = searchTerm;
      //       return response;
      //     },
      //     onSelectElement: (selectedElement) => {
      //       this.editor.commands.setGif({src: selectedElement.media_formats.gif.url, alt: selectedElement.content_description});
      //     },
      //   });
      //   return true;
      // },
    };
  },
});
