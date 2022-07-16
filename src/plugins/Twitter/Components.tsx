import {
  BlockSettingsMenu,
  Button,
  ToggleButton,
} from "../BlockSettingsMenu/BlockSettingsMenu";
import { EyeAlt, EyeOff, Trash } from "iconoir-react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { PluginKey, TextSelection, Transaction } from "prosemirror-state";

import { PLUGIN_NAME } from "./Plugin";
import { renderToStaticMarkup } from "react-dom/server";

export const ImagePluginKey = new PluginKey("ImagePlugin");

export interface TweetOptions {
  src: string;
  width?: number;
  height?: number;
  spoilers?: boolean;
}

interface TweetData {
  author: {
    username: string;
    name: string;
    profile_image_url: string;
  };
  content: {
    text: string;
    created_at: Date;
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
  return (
    <blockquote data-type={PLUGIN_NAME}>
      <p lang="en" dir="ltr">
        F.Narrow is SORCERY
        <a href="https://t.co/tafufU5vL0">https://t.co/tafufU5vL0</a>{" "}
        <a href="https://t.co/JPKnHnis2F">pic.twitter.com/JPKnHnis2F</a>
      </p>
      &mdash; Matt Pocock (@mattpocockuk){" "}
      <a href="https: //twitter.com/mattpocockuk/status/1547563590596513792?ref_src=twsrc%5Etfw">
        July 14, 2022
      </a>
    </blockquote>
  );
};

export const EditableTweetComponent = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as TweetOptions;
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
      <TweetLoadingPlaceholder
        src={attributes.src}
        spoilers={attributes.spoilers}
      />
    </NodeViewWrapper>
  );
};
