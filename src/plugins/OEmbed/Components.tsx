import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { OEmbedData, PLUGIN_NAME } from "./Plugin";
import {
  getWebsiteNameFromUrl,
  listenForResize,
  maybeAttachScriptTagtoDom,
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

const preprocessHtml = (html: string) => {
  // We extract the embed url from the tumblr post, and simply shove it into our own iframe.
  // This saves us from having to use the super heavy-weight tumblr embed library code.
  if (html.includes(`class="tumblr-post"`)) {
    const iframeSrc = html.match(/data\-href="([^"]+)"/)?.[1];
    return `<iframe src="${iframeSrc}" loading="lazy" style="all:unset;width: 100%;display: block;" />`;
  }
  if (html.includes(`class="tiktok-embed"`)) {
    const videoId = html.match(/data\-video\-id="([^"]+)"/)?.[1];
    return `<iframe src="https://www.tiktok.com/embed/v2/${videoId}" loading="lazy" style="all:unset;width: 100%;height:739px;display: block;" />`;
  }

  // For performance reasons, we mark all iframes as "lazy loading".
  if (html.includes(`<iframe `)) {
    return html.replace(`<iframe `, `<iframe loading="lazy"`);
  }
  // For reddit:
  //
  {
    /* <iframe
  id="reddit-embed"
  src="https://www.redditmedia.com/r/ProgrammerHumor/comments/avj910/developers/?ref_source=embed&amp;ref=share&amp;embed=true&amp;theme=dark"
  sandbox="allow-scripts allow-same-origin allow-popups"
  style="border: none;"
  height="527"
  width="640"
  scrolling="no"
></iframe>; */
  }
  return html;
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
      //   maybeAttachScriptTagtoDom(props.html);
      if (node) {
        // NOTE: Lazy loading prevents us from loading the iframe while off screen
        // or hidden.
        await listenForResize(node);
        props.onSizeSettled({
          widthPx: node.getBoundingClientRect().width,
          heightPx: node.getBoundingClientRect().height,
        });
      }
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
