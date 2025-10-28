import type { Meta, StoryObj } from "@storybook/react-vite";

import { type EditorProviderProps } from "@tiptap/react";
import { Plugin as EmojiPlugin } from "../src/Node.js";
import withEditorTreeViewer from "@fujocoded/astrolabe-editor-tree-viewer/decorator";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: "Astrolabe/Emoji",
	//   component: Button,
	parameters: {
		layout: "padded",
		storyPlacement: "after",
		editorTreeViewer: {
			editorTreeViews: [],
		},
	},
	args: {
		// @ts-expect-error - need to add this to the global args
		plugins: [
			EmojiPlugin.configure({
				sets: ["at://did:plc:r2vpg2iszskbkegoldmqa322/com.fujocoded.astrolabe.emojiset/bobatan-og"]
			})
			// Load preferences from com.fujocoded.astrolabe.settings
			// Might include settings for favorite emoji sets, animated gifs, memes, 
			// or extra plugins to load if we're ever that fancy
			// Astrolabe.configure({
			// 	did: "at://did:plc:r2vpg2iszskbkegoldmqa322"
			// })
		],
	},
	decorators: [withEditorTreeViewer],
	component: () => null,
} satisfies Meta<EditorProviderProps & { initialText: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {
	args: {
		initialText:
			`<p>
				<span data-type="emoji" data-name="bobatan-og-bobadab" data-set="at://did:plc:r2vpg2iszskbkegoldmqa322/com.fujocoded.astrolabe.emojiset/bobatan-og" data-fallback="🦝🆒">
					<img src="https://lionsmane.us-east.host.bsky.network/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Ar2vpg2iszskbkegoldmqa322&cid=bafkreifrofbgtrifwocua34nfyerifj27fkzsglhk4vnbsjezwyuifjoqu" alt="bobatan-og-bobadab emoji">
				</span>
			</p>
			<p>
				Want yours? Just type <code>:bobadab:</code>, <code>:bobajustright:</code> or <code>:bobacorn:</code> below 👇 Find <a href="https://pdsls.dev/at://did:plc:r2vpg2iszskbkegoldmqa322/com.fujocoded.astrolabe.emojiset/bobatan-og">the full ATproto record for this emojiset</a> on pdsls.dev!
			</p>
			<p>
			</p>`,
	},
};

export const ViewOnly: Story = {
	args: {
		initialText:
			`Check out <a href="https://pdsls.dev/at://did:plc:r2vpg2iszskbkegoldmqa322/com.fujocoded.astrolabe.emojiset/bobatan-og">the ATproto Record for this emojiset</a> on pdsls.dev 
			<span data-type="emoji" data-name="bobatan-og-bobacorn" data-set="at://did:plc:r2vpg2iszskbkegoldmqa322/com.fujocoded.astrolabe.emojiset/bobatan-og" >
				<img src="https://lionsmane.us-east.host.bsky.network/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Ar2vpg2iszskbkegoldmqa322&cid=bafkreicku5fnyj3kuuxqhjzm7ae56ijxz4nxhhdrlgrmtm75afe2k4hxeq" alt="bobatan-og-bobadab emoji">
			</span>`,
		editable: false,
	},
};
