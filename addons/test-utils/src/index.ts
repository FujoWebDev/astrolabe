export { BlueskyThread } from "./components/BlueskyThread.js";
// export { useEditorToRecord } from "./hooks/useEditorToRecord.js";

export function requireElement<T extends Element = HTMLElement>(
  parent: ParentNode,
  selector: string,
): T {
  const el = parent.querySelector<T>(selector);
  if (!el) throw new Error(`Expected element matching: ${selector}`);
  return el;
}