import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { OEmbedOptions, PLUGIN_NAME } from "./Plugin";

import React from "react";
import { styled } from "@linaria/react";
import { useQuery } from "react-query";

type OEmbedResult = Record<string, unknown> & { html: string };

const Article = styled.article`
  all: unset;
  width: 100%;
`;

export const OEmbed = (props: OEmbedResult) => {
  // TODO: whitelist origins for which this is allowed, as it's a very dangerous operation.
  const maybeAddScript = React.useCallback(() => {
    // Some embeds only work if we allow the associated script tag to be loaded after
    // their content is appended to the DOM, so we extract the tag and manually run it.
    // We cannot do this with the article ref itself because dangerouslySetInnerHTML
    // removes script tags (as does setting innerHTML).
    const fragment = document
      .createRange()
      .createContextualFragment(props.html);
    const scriptTag = fragment?.querySelector("script");
    if (scriptTag) {
      document.body.appendChild(scriptTag);
    }
  }, [props.html]);

  if ("html" in props) {
    // Note: this cannot be done elegantly with an iframe because there's no way
    // to resize an iframe to fit its content.
    return (
      <Article
        dangerouslySetInnerHTML={{ __html: props.html }}
        ref={maybeAddScript}
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
