import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { OEmbedData, PLUGIN_NAME } from "./Plugin";
import { getHtmlForTweetId, getTweetId, preprocessHtml } from "./html-utils";
import {
  getWebsiteNameFromUrl,
  listenForResize,
  listenForTweetResize,
} from "./utils";

import React from "react";
import { styled } from "@linaria/react";
import { useQuery } from "react-query";

type OEmbedResult = Record<string, unknown> & {
  html: string;
  meta: {
    canonical: string;
  };
};

// Note: this tag cannot be an iframe because there's no generic way
// to resize an iframe to fit its content.
const Article = styled.article`
  all: unset;
  width: 100%;

  // TODO: add some kind of loading animation here.
  &[data-loaded="false"] iframe {
    background-color: blue;
  }
`;

export const OEmbed = (
  props: OEmbedResult & {
    loaded: boolean;
    attributes: OEmbedData;
    onSizeSettled: (sizes: {
      widthPx: number | null;
      heightPx: number | null;
    }) => void;
  }
) => {
  const onAttachNode = React.useCallback(
    async (node: HTMLElement | null) => {
      if (!node) {
        return;
      }
      if (node.dataset.source == "twitter.com") {
        const { width, height } = await listenForTweetResize({
          id: getTweetId({ url: node.dataset.src! }),
        });
        const tweetFrame = node.querySelector("iframe");
        if (!tweetFrame) {
          throw new Error("Couldn't find iframe in tweet render.");
        }
        tweetFrame.style.width = width + "px";
        tweetFrame.style.height = height + "px";
      } else {
        // NOTE: native lazy loading prevents us from loading the iframe while off screen
        // or hidden, so (unfortunately) we cannot use it.
        await listenForResize(node);
      }
      props.onSizeSettled({
        widthPx: node.getBoundingClientRect().width,
        heightPx: node.getBoundingClientRect().height,
      });
    },
    [props.html]
  );

  if ("html" in props) {
    const processedHtml = preprocessHtml(props.html);
    return (
      <Article
        data-src={props.attributes.src}
        data-spoilers={props.attributes.spoilers}
        data-width={props.attributes.width}
        data-height={props.attributes.height}
        data-source={getWebsiteNameFromUrl(props.meta.canonical)}
        data-loaded={props.loaded}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        ref={onAttachNode}
      />
    );
  }
  return <>Unimplemented</>;
};

export const OEmbedPlaceholder = (props: OEmbedData) => {
  return (
    <article
      data-src={props.src}
      data-spoilers={props.spoilers}
      data-width={props.width}
      data-height={props.height}
    />
  );
};

export const OEmbedLoader = (
  props: Partial<NodeViewProps> &
    Required<Pick<NodeViewProps, "node" | "extension">>
) => {
  const [loaded, setLoaded] = React.useState(false);
  const attributes = props.node.attrs as OEmbedData;
  const { isLoading, data } = useQuery<OEmbedResult>(
    ["oembed", { src: attributes.src }],
    async () => {
      if (getWebsiteNameFromUrl(attributes.src) === "twitter.com") {
        return {
          html: getHtmlForTweetId(getTweetId({ url: attributes.src })),
          meta: {
            canonical: attributes.src,
          },
        };
      }
      return await (
        await fetch(props.extension.options.getRequestEndpoint(attributes.src))
      ).json();
    }
  );

  if (isLoading || !data) {
    return (
      <NodeViewWrapper data-type={PLUGIN_NAME}>
        <div>loading</div>
      </NodeViewWrapper>
    );
  }

  console.log("Data from embed server", data);

  return (
    <NodeViewWrapper data-type={PLUGIN_NAME}>
      <OEmbed
        {...data}
        attributes={attributes}
        loaded={loaded}
        onSizeSettled={(sizes) => {
          props.updateAttributes?.({
            width: sizes.widthPx,
            height: sizes.heightPx,
          });
          setLoaded(true);
        }}
      />
    </NodeViewWrapper>
  );
};
