import { PLUGIN_NAME, TweetOptions } from "./Plugin";

import { styled } from "@linaria/react";
import { useQuery } from "react-query";

export interface TweetData {
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

export const NativeTweetComponent = (
  props: TweetOptions & {
    onLoaded: () => void;
  }
) => {
  const { isLoading, data } = useQuery<TweetData>(
    ["tweets", { src: props.src }],
    async () => {
      return fromApiResult(await (await fetch(props.src)).json());
    },
    {
      onSettled: () => {
        props.onLoaded();
      },
    }
  );

  if (isLoading || !data) {
    return null;
  }

  return (
    <article data-spoilers={props.spoilers} data-native={props.native}>
      <Author className="author">
        <img
          className="avatar"
          src={data.author.avatar_url}
          alt="The avatar of the tweet's author"
        />
        <div className="name">{data.author.name}</div>
        <div className="username">@{data.author.username}</div>
      </Author>
      <blockquote data-type={PLUGIN_NAME}>{data.content.text}</blockquote>
    </article>
  );
};
