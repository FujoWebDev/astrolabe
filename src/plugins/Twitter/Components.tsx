import {
  BlockSettingsMenu,
  Button,
  ToggleButton,
} from "../BlockSettingsMenu/BlockSettingsMenu";
import { EyeAlt, EyeOff, Trash } from "iconoir-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { PLUGIN_NAME, TweetOptions } from "./Plugin";

import { styled } from "@linaria/react";
import { useQuery } from "react-query";

// TODO: once the twitter API TS library is released, use that and get
// strong typing
const fromApiResult = (apiResult: {
  data: {
    id: string;
    created_at: string;
    author_id: string;
    text: string;
  }[];
  includes: {
    users: {
      profile_image_url: string;
      username: string;
      name: string;
      id: string;
    }[];
  };
}): TweetData => {
  const { id, created_at, author_id, text } = apiResult.data[0];
  const authorData = apiResult.includes.users.find(
    (user) => user.id == author_id
  );

  if (!authorData) {
    throw Error("Couldn't find author data in Tweet");
  }
  return {
    id,
    author: {
      avatar_url: authorData.profile_image_url,
      name: authorData.name,
      username: authorData.username,
    },
    content: {
      text,
      created_at: Date.parse(created_at),
    },
  };
};

interface TweetData {
  id: string;
  author: {
    username: string;
    name: string;
    avatar_url: string;
  };
  content: {
    text: string;
    // Timestamp format
    created_at: number;
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

const Author = styled.div`
  display: grid;
  grid-template-columns: fit-content(50px) 1fr;
  grid-template-rows: 1fr 1fr;
  grid-template-areas:
    "avatar name"
    "avatar username";
  grid-column-gap: 5px;
  align-items: center;
  .avatar {
    grid-area: avatar;
  }
  .name {
    grid-area: name;
  }
  .username {
    grid-area: username;
  }
`;

export const TweetComponent = (props: TweetData) => {
  return (
    <article>
      <Author className="author">
        <img
          className="avatar"
          src={props.author.avatar_url}
          alt="The avatar of the tweet's author"
        />
        <div className="name">{props.author.name}</div>
        <div className="username">@{props.author.username}</div>
      </Author>
      <blockquote data-type={PLUGIN_NAME}>{props.content.text}</blockquote>
    </article>
  );
};

export const EditableTweetComponent = (
  props: Partial<NodeViewProps> & Required<Pick<NodeViewProps, "node">>
) => {
  const attributes = props.node.attrs as TweetOptions;
  const { isLoading, data } = useQuery<TweetData>(
    ["tweets", { src: attributes.src }],
    async () => {
      return fromApiResult(await (await fetch(attributes.src)).json());
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
