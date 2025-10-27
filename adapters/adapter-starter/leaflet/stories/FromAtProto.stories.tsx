import { convert as toMdast } from "@fujocoded/astdapters-mdast-starter";
import {
	type EditorTreeViewConfig,
	withEditorTreeViewer,
} from "@fujocoded/astrolabe-editor-tree-viewer/decorator";
import type { Meta, StoryObj } from "@storybook/react-vite";
// import { BlueskyPost } from "./components/BlueskyPost.js";
import { useCurrentEditor } from "@tiptap/react";
import { toMarkdown } from "mdast-util-to-markdown";
import React from "react";
// import { useEditorToRecord } from "../helpers/useEditorToRecord.js";
import { convert, fromLeafletPost } from "../src/index.js";
import record from "./records/did:plc:dg2qmmjic7mmecrbvpuhtvh6:pub.leaflet.document:3lzi4z4g6kc26.json";

// TODO: add leaflet record type here
const convertFromRecord = (record: Record<string, unknown>) => {
	const post = fromLeafletPost(record.value.pages[0] as any);
	return post;
};

const editorTreeViews: EditorTreeViewConfig[] = [
	{
		id: "leaflet-rich-text",
		label: "Leaflet Rich Text",
		compute: async ({ editorJson }) => {
			return {
				type: "json",
				content: record.value.pages[0],
			};
		},
	},
	{
		id: "mdast-json",
		label: "ProseMirror JSON",
		compute: async ({ editorJson }) => {
			const mdastTree = editorJson;
			return {
				type: "json",
				content: mdastTree as unknown as Record<string, unknown>,
			};
		},
	},
	{
		id: "markdown",
		label: "Markdown",
		compute: async ({ editorJson }) => {
			const mdastTree = toMdast(editorJson);
			return {
				type: "markdown",
				content: toMarkdown(mdastTree, { emphasis: "_" }),
			};
		},
	},
];

const meta = {
	title: "Adapters/Starter—Leaflet-From",
	parameters: {
		layout: "padded",
		plugins: [],
		hideEditor: false,
		editorTreeViewer: {
			editorTreeViews,
		},
	},
	decorators: [withEditorTreeViewer],
	render: () => (<></>),
	// render: ({ record }) => {
	// 	const leafletRecord = useEditorToRecord({
	// 		initialRecord: record as LeafletPost.Record,
	// 	});

	// 	return <LeafletPost key={leafletRecord.text} record={leafletRecord} />;
	// },
} satisfies Meta<{
	initialText: string | Record<string, unknown>;
	record: Record<string, unknown>;
}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BaseLexicon: Story = {
	args: {
		record: record,
		initialText: convertFromRecord(record),
	},
};
