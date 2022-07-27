import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { OEmbedOptions, PLUGIN_NAME } from "./Plugin";
import { listenForResize, maybeAttachScriptTagtoDom } from "./utils";

import React from "react";
import { styled } from "@linaria/react";
import { useQuery } from "react-query";

type OEmbedResult = Record<string, unknown> & { html: string };

// Note: this tag cannot be an iframe because there's no generic way
// to resize an iframe to fit its content.
const Article = styled.article`
  all: unset;
  width: 100%;
`;

const preprocessHtml = (html: string) => {
  // We extract the embed url from the tumblr post, and simply shove it into our own iframe.
  // This saves us from having to use the super heavy-weight tumblr embed library code.
  if (html.includes(`class="tumblr-post"`)) {
    const iframeSrc = html.match(/data\-href="([^"]+)"/)?.[1];
    return `<iframe src="${iframeSrc}" style="all:unset;width: 100%;display: block;" />`;
  }
  return html;
};

export const OEmbed = (props: OEmbedResult) => {
  const onAttachNode = React.useCallback(
    async (node: HTMLElement | null) => {
      //   maybeAttachScriptTagtoDom(props.html);
      if (node) {
        await listenForResize(node);
      }
    },
    [props.html]
  );

  if ("html" in props) {
    const processedHtml = preprocessHtml(props.html);
    return (
      <Article
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        ref={onAttachNode}
      />
    );
  }
  return <>Unimplemented</>;
};

export const OEmbedPlaceholder = (props: OEmbedOptions) => {
  return <article data-src={props.src} data-spoilers={props.spoilers} />;
};

export const OEmbedLoader = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as OEmbedOptions;
  const { isLoading, data } = useQuery<OEmbedResult>(
    ["oembed", { src: attributes.src }],
    async () => {
      // TODO: remove hardcoded url
      return await (
        await fetch(`http://localhost:8062/iframely?url=${attributes.src}`)
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
      <OEmbed {...data} />
    </NodeViewWrapper>
  );
};
