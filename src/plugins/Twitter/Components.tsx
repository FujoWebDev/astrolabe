import {
  BlockSettingsMenu,
  Button,
  ToggleButton,
} from "../BlockSettingsMenu/BlockSettingsMenu";
import { EyeAlt, EyeOff, FrameTool, Trash, Www } from "iconoir-react";
import { NativeTweetComponent, TweetData } from "./NativeTweetComponent";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { PLUGIN_NAME, TweetOptions } from "./Plugin";

import { OEmbed } from "../OEmbed/Components";
import React from "react";
import { getTweetId } from "./utils";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        createTweet: (
          id: string,
          node: HTMLElement,
          options: any
        ) => Promise<HTMLElement>;
      };
    };
  }
}

const TweetOptionsMenu = (props: {
  spoilers: boolean;
  native: boolean;
  onToggleSpoilers: (spoilers: boolean) => void;
  onToggleNative: (native: boolean) => void;
  onDeleteRequest: () => void;
}) => {
  return (
    <BlockSettingsMenu>
      <ToggleButton
        value={props.spoilers}
        title="toggle spoilers"
        onValueChange={props.onToggleSpoilers}
      >
        {props.spoilers ? <EyeAlt /> : <EyeOff />}
      </ToggleButton>
      <ToggleButton
        value={props.native}
        title="toggle native"
        onValueChange={props.onToggleNative}
      >
        {props.native ? <Www /> : <FrameTool />}
      </ToggleButton>
      <Button title="delete component" onClick={props.onDeleteRequest}>
        <Trash />
      </Button>
    </BlockSettingsMenu>
  );
};

export const TweetPlaceholder = (
  props: TweetOptions & {
    loaded?: boolean;
  }
) => {
  return (
    <article
      data-type={PLUGIN_NAME}
      data-spoilers={props.spoilers}
      data-src={props.src}
      data-width={props.width}
      data-height={props.height}
      data-native={props.native}
      {...(props.loaded ? { "data-loaded": true } : {})}
    />
  );
};

export const TweetIframeComponent = (
  props: TweetOptions & {
    onLoaded: () => void;
  }
) => {
  React.useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        event.origin !== "https://platform.twitter.com" ||
        !event.data["twttr.embed"]
      ) {
        return;
      }
      console.log(event.data["twttr.embed"]);
    };
    window.addEventListener("message", listener);
    return () => {
      window.removeEventListener("message", listener);
    };
  }, []);

  const tweetId = getTweetId({ url: props.src });
  return (
    <OEmbed
      html={`
        <iframe
          data-tweet-id="${tweetId}"
          src="https://platform.twitter.com/embed/Tweet.html?dnt=false&frame=false&hideCard=false&hideThread=false&id=${tweetId}&lang=en&theme=dark&width=550px"
          scrolling="no"
        />`}
      meta={{ canonical: props.src }}
      attributes={props}
      loaded={true}
      onSizeSettled={() => {
        props.onLoaded();
      }}
    />
  );
};

export const EditableTweetComponent = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as TweetOptions;
  const [loaded, setLoaded] = React.useState(false);

  return (
    <NodeViewWrapper data-type={PLUGIN_NAME}>
      <TweetOptionsMenu
        spoilers={!!attributes.spoilers}
        onToggleSpoilers={(spoilers) =>
          props.updateAttributes?.({
            spoilers,
          })
        }
        native={!!attributes.native}
        onToggleNative={(native) => {
          setLoaded(false);
          props.updateAttributes?.({
            native,
          });
        }}
        onDeleteRequest={() => props.deleteNode?.()}
      />
      {!loaded && (
        <TweetPlaceholder src={attributes.src} spoilers={attributes.spoilers} />
      )}
      {attributes.native ? (
        <NativeTweetComponent
          {...attributes}
          onLoaded={() => setLoaded(true)}
        />
      ) : (
        <TweetIframeComponent
          {...attributes}
          onLoaded={() => setLoaded(true)}
        />
      )}
    </NodeViewWrapper>
  );
};
