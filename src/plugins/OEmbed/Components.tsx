import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { OEmbedOptions, PLUGIN_NAME } from "./Plugin";

import { styled } from "@linaria/react";
import { useQuery } from "react-query";

type OEmbedResult = Record<string, unknown> & { html: string };

const IFrame = styled.iframe`
  all: unset;
  width: 100%;
`;

const Article = styled.article`
  all: unset;
  width: 100%;
`;

export const OEmbed = (props: OEmbedResult) => {
  if ("html" in props) {
    // Note: this cannot be done elegantly with an iframe because there's no way
    // to resize an iframe to fit its content.
    return <Article dangerouslySetInnerHTML={{ __html: props.html }} />;
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
  console.log(attributes);
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
