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
import { IdResolver } from "@atproto/identity";

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

const getPdsUrl = async (did: string) => {
	const ID_RESOLVER = new IdResolver();
	const atproto = await ID_RESOLVER.did.resolveAtprotoData(did);
	const pdsUrl = atproto.pds;
	return pdsUrl;
}

const fetchEmojiSet = async (emojiSet: AtUri) => {
	const pds = await getPdsUrl(emojiSet.host);
	const emojiUrl = new URL("/xrpc/com.atproto.repo.getRecord", pds);
	emojiUrl.searchParams.set("repo", emojiSet.host);
	emojiUrl.searchParams.set("collection", emojiSet.collection);
	emojiUrl.searchParams.set("rkey", emojiSet.rkey);

	return fetch(emojiUrl);
	// return Promise.resolve(sampleSet);
}

const toTipTapEmoji = async (emoji: Atmoji, emojiSet: AtUri) => {
	const pds = await getPdsUrl(emojiSet.host);
	const emojiUrl = new URL("/xrpc/com.atproto.sync.getBlob", pds);
	emojiUrl.searchParams.set("did", emojiSet.host);
	emojiUrl.searchParams.set("cid", emoji.image.image.ref.$link);

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
	async onBeforeCreate(event) {
		for (const set of this.options.sets) {
			const emojiSetAtUri = typeof set == "string" ? new AtUri(set) : set;
			fetchEmojiSet(emojiSetAtUri).then(async response => {
				if (response) {
					const emojiSet = await response.json() as {"value": any};
					for (const emoji of emojiSet.value.emojis) {
						const tiptapEmoji = await toTipTapEmoji(emoji, emojiSetAtUri)
						this.storage.emojis.push(tiptapEmoji);
					}
				}
			});
		}

	},
	addAttributes() {
		return {
			...this.parent!(),
			fallbackImage: {
				default: null,
				parseHTML: element => element.querySelector("img")?.src
			},
			fallbackAlt: {
				default: null,
				parseHTML: element => element.querySelector("img")?.alt
			}
		}
	},

	renderHTML(props) {
		const renderedByParent = this.parent?.(props);
		// If the parent would render a string at the second slot, but there is a fallback image
		// attribute, then render the fallback image attribute.
		// TODO: this is a hack that assumes we know the type of the parent
		// TODO: should figure out how to make sure to defer the load until all is loaded
		if (typeof renderedByParent[2] === "string" && props.HTMLAttributes.fallbackImage) {
			renderedByParent[2] =[
            'img',
            {
              src: props.HTMLAttributes.fallbackImage,
              draggable: 'false',
              loading: 'lazy',
              align: 'absmiddle',
              alt: props.HTMLAttributes.fallbackAlt ?? `Emoji`,
            },
          ]

		}
		return renderedByParent;
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