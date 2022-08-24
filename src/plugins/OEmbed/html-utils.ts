export const preprocessHtml = (html: string) => {
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

export const getHtmlForTweetId = (tweetId: string) => {
  return `<iframe
      data-tweet-id="${tweetId}"
      src="https://platform.twitter.com/embed/Tweet.html?dnt=false&frame=false&hideCard=false&hideThread=false&id=${tweetId}&lang=en&theme=dark&width=550px"
      scrolling="no"
      style="width:100%;display:block;"
    />`;
};

// TODO: find a more appropriate place for this
export const getTweetId = ({ url }: { url: string }) => {
  const urlObject = new URL(url);
  return urlObject.pathname.substr(urlObject.pathname.lastIndexOf("/") + 1);
};
