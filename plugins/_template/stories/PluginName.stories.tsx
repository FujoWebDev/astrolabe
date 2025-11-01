import type { Meta, StoryObj } from "@storybook/react-vite";

import { type EditorProviderProps } from "@tiptap/react";
import { Plugin as PluginNamePlugin } from "../src/Node.js";
import "../src/plugin-name.css";
import withEditorTreeViewer from "@fujocoded/astrolabe-editor-tree-viewer/decorator";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: "Astrolabe/PluginName",
	parameters: {
		layout: "padded",
		storyPlacement: "after",
		editorTreeViewer: {
			editorTreeViews: [],
		},
	},
	args: {
		// @ts-expect-error - need to add this to the global args
		plugins: [PluginNamePlugin],
	},
	decorators: [withEditorTreeViewer],
	component: () => null,
} satisfies Meta<EditorProviderProps & { initialText: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {
	args: {
		initialText:
			"Hello!",
	},
};

export const ViewOnly: Story = {
	args: {
		initialText:
			"Hello",
		editable: false,
	},
};