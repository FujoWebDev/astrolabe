import type { Root } from "mdast";

// TODO: unify this with the Bluesky remark plugins
export type RemarkPlugin = (tree: Root, options?: any) => void;

export const DEFAULT_LEAFLET_PLUGINS: RemarkPlugin[] = [];
