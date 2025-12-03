import type { Meta, StoryObj } from "@storybook/react-vite";

import { type EditorProviderProps } from "@tiptap/react";
import { Button as InlineSpoilersButton } from "../src/button.tsx";
import { Plugin as InlineSpoilersPlugin } from "../src/Mark.js";
import "../src/inline-spoilers.css";
import withEditorTreeViewer from "@fujocoded/astrolabe-editor-tree-viewer/decorator";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: "Astrolabe/SpoilerText",
	//	 component: Button,
	parameters: {
		layout: "padded",
		buttons: [InlineSpoilersButton],
		storyPlacement: "after",
		editorTreeViewer: {
			editorTreeViews: [],
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

export const Editable: Story = {
	args: {
		initialText:
			"Some <button data-type='inline-spoilers' aria-expanded='false'><span>text spoilers</span><span class='content'>spoilered</span></button> text",
	},
};

export const ViewOnly: Story = {
	args: {
		initialText:
			"Some <button data-type='inline-spoilers' aria-expanded='false'><span class='content'>spoilered</span></button> text",
		editable: false,
	},
};

export const MultiSpoilerViewOnly: Story = {
	args: {
		initialText:
			"Some <button data-type='inline-spoilers' aria-expanded='false'><span class='content'>very secret spoilered</span></button> text with extra <button data-type='inline-spoilers' aria-expanded='false'><span class='content'>spoilers</span></button>.",
		editable: false,
	},
};
