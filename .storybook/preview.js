import { worker } from "../stories/utilities/mocks/browser";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

const MUTED_PATHS = ["src/", "node_modules/"];
worker.start({
  onUnhandledRequest(req) {
    if (
      req.url.hostname == "localhost" ||
      MUTED_PATHS.some((path) => req.url.pathname.startsWith(path))
    ) {
      return;
    }
    console.error(
      "Found an unhandled %s request to %s",
      req.method,
      req.url.href
    );
  },
});
