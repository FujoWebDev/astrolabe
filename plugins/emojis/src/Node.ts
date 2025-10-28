import {
	Node,
	// markInputRule,
	// markPasteRule,
	mergeAttributes,
} from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import "./emojis.css";
import Emoji, {type EmojiOptions, emojis } from '@tiptap/extension-emoji'
import { AtUri } from "@atproto/syntax"

// import "../src/emojis.css";

export interface Options {
	sets: (string | AtUri)[]
}

type Atmoji = unknown; //(typeof sampleSet)["emojis"][number];

export const Key = new PluginKey("EmojisPlugin");

export const PLUGIN_NAME = "emojis";
declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		[PLUGIN_NAME]: {
			// setInlineSpoilers: (attributes?: { visible: boolean }) => ReturnType;
			// toggleInlineSpoilers: (attributes?: { visible: boolean }) => ReturnType;
			// unsetInlineSpoilers: () => ReturnType;
		};
	}
}

const fetchEmojiSet = (emojiSet: AtUri) => {
	const emojiUrl = new URL("/xrpc/com.atproto.repo.getRecord", "https://lionsmane.us-east.host.bsky.network");
	emojiUrl.searchParams.set("repo", emojiSet.host);
	emojiUrl.searchParams.set("collection", emojiSet.collection);
	emojiUrl.searchParams.set("rkey", emojiSet.rkey);

	return fetch(emojiUrl);
	// return Promise.resolve(sampleSet);
}

const toTipTapEmoji = (emoji: Atmoji, emojiSet: AtUri) => {
	const emojiUrl = new URL("/xrpc/com.atproto.sync.getBlob", "https://lionsmane.us-east.host.bsky.network");
	emojiUrl.searchParams.set("did", emojiSet.host);
	emojiUrl.searchParams.set("cid", emoji.image.image.ref.$link);

	console.dir(emojiUrl.toString())
  return { // A unique name of the emoji which will be stored as attribute
    name: `${emojiSet.rkey}-${emoji.shortcode}`,
    // A list of unique shortcodes that are used by input rules to find the emoji
    shortcodes: [emoji.shortcode],
    // A list of tags that can help for searching emojis
    tags: [],
    // A name that can help to group emojis
    group: emojiSet.rkey,
    // The image to be rendered
    fallbackImage: emojiUrl.toString()
  }
}

export const Plugin = Emoji.extend<EmojiOptions & Options>({
	onCreate() {
		console.log("Editor created")
	},
	async onBeforeCreate(event) {
		for (const set of this.options.sets) {
			const emojiSetAtUri = typeof set == "string" ? new AtUri(set) : set;
			fetchEmojiSet(emojiSetAtUri).then(async response => {
				if (response) {
					const emojiSet = await response.json() as {"value": any};
					for (const emoji of emojiSet.value.emojis) {
						const tiptapEmoji = toTipTapEmoji(emoji, emojiSetAtUri)
						this.storage.emojis.push(tiptapEmoji);
					}
				}
			});
		}

	},

	// @ts-expect-error typescript shut up
	addOptions() {
		return { 
      ...this.parent?.(),
	  sets: [] as (string | AtUri)[]};
	}

}).configure({
	emojis: [...emojis]
});