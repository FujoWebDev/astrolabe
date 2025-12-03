import { convert as toBlueskyRichtText } from "@fujocoded/astdapters-bluesky-starter";
import { useEditorToRecord } from "@fujocoded/astdapters-bluesky-starter/helpers";
import { convert as toMdast } from "@fujocoded/astdapters-mdast-starter";
import { useEditorToMdast } from "@fujocoded/astdapters-mdast-starter/helpers";
import {
	type EditorTreeViewConfig,
	withEditorTreeViewer,
} from "@fujocoded/astrolabe-editor-tree-viewer/decorator";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DocumentType } from "@tiptap/core";
import type { EditorProviderProps } from "@tiptap/react";
import { BlueskyThread } from "astrolabe-test-utils";
import { toMarkdown } from "mdast-util-to-markdown";
import { toMdastNode, toRot13Text } from "../adapter/spoilers.ts";
import { Button as InlineSpoilersButton } from "../src/button.tsx";
import { Plugin as InlineSpoilersPlugin } from "../src/Mark.js";

import { spoilers } from "../adapter/remark-node.ts";

import "../src/inline-spoilers.css";

const editorTreeViews: EditorTreeViewConfig[] = [
	{
		id: "editor-json",
		label: "Editor JSON",
		compute: async ({ editorJson }) => {
			return {
				type: "json",
				content: editorJson as unknown as Record<string, unknown>,
			};
		},
	},
	{
		id: "mdast-json",
		label: "mdast JSON",
		compute: async ({ editorJson }) => {
			const mdastTree = toMdast(editorJson, { plugins: [toMdastNode] });
			return {
				type: "json",
				content: mdastTree as unknown as Record<string, unknown>,
			};
		},
	},
	{
		id: "bluesky-rich-text",
		label: "Bluesky Rich Text",
		compute: async ({ editorJson }) => {
			const richText = await toBlueskyRichtText(
				structuredClone(editorJson) as DocumentType,
				{
					jsonDocPlugins: [toRot13Text],
				}
			);

			return {
				type: "json",
				content: {
					text: richText.text.text,
					length: richText.text.text.length,
					facets: richText.text.facets,
				},
			};
		},
	},
];

const meta = {
	title: "Adapters/InlineSpoilers",
	parameters: {
		layout: "padded",
		buttons: [InlineSpoilersButton],
		hideEditor: false,
		storyPlacement: "after",
		editorTreeViewer: {
			editorTreeViews,
		},
	},
	args: {
		// @ts-expect-error - need to add this to the global args
		plugins: [InlineSpoilersPlugin],
	},
	decorators: [withEditorTreeViewer],
	component: () => null,
} satisfies Meta<EditorProviderProps & { initialText: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bluesky: Story = {
	args: {
		initialText:
			"Some <button data-type='inline-spoilers' data-visible='false'><span class='content'>spoilered</span></button> text",
	},
	render: () => {
		const blueskyRecord = useEditorToRecord({ jsonDocPlugins: [toRot13Text] });

		return (
			<BlueskyThread
				key={JSON.stringify(blueskyRecord)}
				records={blueskyRecord}
			/>
		);
	},
};

export const Markdown: Story = {
	args: {
		initialText:
			"Some <button data-type='inline-spoilers' data-visible='false'><span class='content'>spoilered</span></button> text",
	},
	render: () => {
		const mdast = useEditorToMdast([toMdastNode]);

		return (
			<pre>
				{toMarkdown(mdast, {
					emphasis: "_",
					handlers: {
						spoilers: spoilers,
					},
				})}
			</pre>
		);
	},
};

export const MarkdownNested: Story = {
	args: {
		initialText:
			"Some <button data-type='inline-spoilers' data-visible='false'><span class='content'>spoi<strong>ler</strong>ed</span></button> text",
	},
	render: () => {
		const mdast = useEditorToMdast([toMdastNode]);

		return (
			<pre>
				{toMarkdown(mdast, {
					emphasis: "_",
					handlers: {
						spoilers: spoilers,
					},
				})}
			</pre>
		);
	},
};
