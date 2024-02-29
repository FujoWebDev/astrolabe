import {
  BlockBaseComponent,
  BlockBaseMenu,
  BlockBaseProps,
} from "@bobaboard/tiptap-block-with-menu";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { OEmbedData, PLUGIN_NAME } from "./Plugin";
import { getHtmlForTweetId, getTweetId, preprocessHtml } from "./html-utils";
import {
  getWebsiteNameFromUrl,
  listenForResize,
  listenForTweetResize,
} from "./utils";

import React from "react";
import { css } from "@linaria/core";
import { makeDataAttributes } from "../utils";

type OEmbedResult = Record<string, unknown> & {
  html: string;
  meta: {
    canonical: string;
  };
};

// Note: this tag cannot be an iframe because there's no generic way
// to resize an iframe to fit its content.
const wrapperClass = css`
  div {
    all: unset;
    width: 100%;

    // TODO: add some kind of loading animation here.
    &[data-loaded="false"] iframe {
      background-color: blue;
    }
  }
`;

export const OEmbed = (
  props: BlockBaseProps &
    OEmbedResult & {
      loaded: boolean;
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
      <BlockBaseComponent {...props} className="embed" enclosingTag={"article"}>
        <div
          className={wrapperClass}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
          data-site={getWebsiteNameFromUrl(props.meta.canonical)}
          data-loaded={props.loaded}
          ref={onAttachNode}
        />
      </BlockBaseComponent>
    );
  }
  return <>Unimplemented</>;
};

// This Placeholder is only used in renderHTML and is intended to enable
// data portability/sharing across platform eg. in an RSS feed.
// Thus we render a plain html article with data-attributes instead of the full BlockBaseComponent (which has some inherent styling)
// to let the end consumer have full control over how they rebuild the content.
export const OEmbedPlaceholder = (
  props: Pick<BlockBaseProps, "attributes" | "pluginName">
) => {
  const attributes = props.attributes;
  const dataAttributes = makeDataAttributes(attributes);
  return <article data-type={props.pluginName} {...dataAttributes}></article>;
};

const useQuery = <T extends Object>(key: any[], getter: () => Promise<T>) => {
  const [isLoading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<T | null>(null);

  getter().then((result) => {
    setLoading(false);
    setData(result);
  });

  return { isLoading, data };
};

export const OEmbedLoader = (
  props: Partial<NodeViewProps> &
    Required<Pick<NodeViewProps, "node" | "extension" | "editor">>
) => {
  const [loaded, setLoaded] = React.useState(false);
  const attributes = props.node.attrs as OEmbedData;
  const editable = props.editor.isEditable;
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
      {editable && <BlockBaseMenu {...props} deleteTitle="Embed" />}
      <OEmbed
        {...data}
        pluginName={PLUGIN_NAME}
        attributes={attributes}
        editable={editable}
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
