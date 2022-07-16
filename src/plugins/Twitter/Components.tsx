import {
  BlockSettingsMenu,
  Button,
  ToggleButton,
} from "../BlockSettingsMenu/BlockSettingsMenu";
import { EyeAlt, EyeOff, Trash } from "iconoir-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { PLUGIN_NAME, TweetOptions } from "./Plugin";

import { useQuery } from "react-query";

interface TweetData {
  author: {
    username: string;
    name: string;
    profile_image_url: string;
  };
  content: {
    text: string;
    created_at: string;
  };
}

const TweetOptionsMenu = (props: {
  spoilers: boolean;
  onToggleSpoilers: (spoilers: boolean) => void;
  onDeleteRequest: () => void;
}) => {
  return (
    <BlockSettingsMenu>
      <ToggleButton
        value={!!props.spoilers}
        title="toggle spoilers"
        onValueChange={props.onToggleSpoilers}
      >
        {props.spoilers ? <EyeAlt /> : <EyeOff />}
      </ToggleButton>
      <Button title="delete component" onClick={props.onDeleteRequest}>
        <Trash />
      </Button>
    </BlockSettingsMenu>
  );
};

export const TweetLoadingPlaceholder = (props: TweetOptions) => {
  return <div data-type={PLUGIN_NAME}>Loading tweet</div>;
};

export const TweetComponent = (props: TweetData) => {
  return <blockquote data-type={PLUGIN_NAME}>{props.content.text}</blockquote>;
};

export const EditableTweetComponent = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as TweetOptions;
  const { isLoading, data } = useQuery<TweetData>(
    ["tweets", { src: attributes.src }],
    async () => {
      return (await fetch(attributes.src)).json();
    }
  );
  return (
    <NodeViewWrapper data-type={PLUGIN_NAME}>
      <TweetOptionsMenu
        spoilers={!!attributes.spoilers}
        onToggleSpoilers={(spoilers) =>
          props.updateAttributes?.({
            spoilers,
          })
        }
        onDeleteRequest={() => props.deleteNode?.()}
      />
      {isLoading || !data ? (
        <TweetLoadingPlaceholder
          src={attributes.src}
          spoilers={attributes.spoilers}
        />
      ) : (
        <TweetComponent {...data} />
      )}
    </NodeViewWrapper>
  );
};
