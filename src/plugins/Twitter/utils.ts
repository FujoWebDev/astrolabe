export const getTweetId = ({ url }: { url: string }) => {
  const urlObject = new URL(url);
  return urlObject.pathname.substr(urlObject.pathname.lastIndexOf("/") + 1);
};
