import { Extensions, JSONContent, generateHTML } from "@tiptap/core";

import React from "react";
import { addons } from "@storybook/addons";
import htmlParsers from "prettier/parser-html";
import prettier from "prettier/standalone";

const sanitizeJson = (json: JSONContent) => {
  return {
    ...json,
    content: json.content?.map((item) => {
      if (!item.attrs || !("src" in item.attrs)) {
        return item;
      }
      return {
        ...item,
        attrs: {
          ...item.attrs,
          // If we have data:image attributes, these are going to be very long, which makes codemirror not have a good time
          src: item.attrs.src.substring(0, 1000),
        },
      };
    }),
  };
};

const formatHtml = (json: JSONContent, extensions: Extensions) => {
  const html = generateHTML(json, extensions);
  return prettier
    .format(
      html
        // linebreaks preceeded by text (that is not a closing tag) should break
        // on their own line
        .replaceAll(/[^>]<br( \/)?>/g, "\n<br />\n")
        // linebreaks followed by text (that is not an opening tag) should move
        // the text to the following line
        .replaceAll(/<br( \/)?>[^<]/g, "<br />\n"),
      {
        parser: "html",
        plugins: [htmlParsers],
      }
    )
    .trim();
};

export const CHANNEL_NAME = "CONTENT_UPDATED_CHANNEL";
export const getContentChangeHandler =
  (extensions: Extensions) => (json: JSONContent) => {
    const sanitizedJson = sanitizeJson(json);
    addons.getChannel().emit(CHANNEL_NAME, {
      json: sanitizedJson,
      html: formatHtml(sanitizedJson, extensions),
    });
  };
