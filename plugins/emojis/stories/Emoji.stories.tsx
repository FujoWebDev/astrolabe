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
   argTypes: {
	emojiSets: {
		control: { type: 'check' },
		options: ['bobatan-og', 'pikashock'],
		mapping: {
			'bobatan-og': "at://did:plc:r2vpg2iszskbkegoldmqa322/com.fujocoded.astrolabe.emojiset/bobatan-og",
			"pikashock": "at://did:plc:dg2qmmjic7mmecrbvpuhtvh6/com.fujocoded.astrolabe.emojiset/pikashock"
		},
		default: ['bobatan-og'],
		
	},
	initialText: {
		control: false,
	},
},
		decorators: [
		(Story, context) => {
			const { args } = context;
			return withEditorTreeViewer(Story, {
				...context,
				args: {
					...args,
					plugins: [EmojiPlugin.configure({ sets: args.emojiSets ?? [] })]
				}
			});
		}
		],
	component: () => null,
} satisfies Meta<EditorProviderProps & { initialText: string, emojiSets: string[] }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditableSingleSet: Story = {
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
		emojiSets: ['bobatan-og'],
	},
};

export const EditableMultipleSets: Story = {
	args: {
		// TODO: add an emoji from pikashock too
		initialText:
			`<p>
				<span data-type="emoji" data-name="bobatan-og-bobadab" data-set="at://did:plc:r2vpg2iszskbkegoldmqa322/com.fujocoded.astrolabe.emojiset/bobatan-og" data-fallback="🦝🆒">
					<img src="https://lionsmane.us-east.host.bsky.network/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Ar2vpg2iszskbkegoldmqa322&cid=bafkreifrofbgtrifwocua34nfyerifj27fkzsglhk4vnbsjezwyuifjoqu" alt="bobatan-og-bobadab emoji">
				</span>
			</p>
			<p>
				Want yours? Just type <code>:bobadab:</code>, <code>:bobajustright:</code> or <code>:bobacorn:</code> below 👇 Find <a href="https://pdsls.dev/at://did:plc:r2vpg2iszskbkegoldmqa322/com.fujocoded.astrolabe.emojiset/bobatan-og">the full ATproto record for this emojiset</a> on pdsls.dev!
				Want even more? Try <code>:pikagrass:</code>, <code>:pikameh:</code>, <code>:pikastare:</code>, or even <code>:pichu:</code> below 👇 Find <a href="https://pdsls.dev/at://did:plc:dg2qmmjic7mmecrbvpuhtvh6/com.fujocoded.astrolabe.emojiset/pikashock">the full ATproto record for this OTHER emojiset</a> on pdsls.dev!
			</p>
			<p>
		</p>`,
		emojiSets: ['bobatan-og', 'pikashock'],
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
		emojiSets: ['bobatan-og'],
	},
};
