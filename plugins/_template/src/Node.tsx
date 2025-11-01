import {
	Node,
} from "@tiptap/core";
import "./plugin-name.css";

export interface Options {
}


export const PLUGIN_NAME = "emojis";
declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		[PLUGIN_NAME]: {
            // TODO: here is where the commands for the plugin will go
            // Commands are the functions that can be called externally to perform actions in the editor.
			// setInlineSpoilers: (attributes?: { visible: boolean }) => ReturnType;
			// toggleInlineSpoilers: (attributes?: { visible: boolean }) => ReturnType;
			// unsetInlineSpoilers: () => ReturnType;
		};
	}
}

// See "how to develop custom extensions": https://tiptap.dev/docs/editor/extensions/custom-extensions
// This may also be a Mark (see InlineSpoilers), a Node (see ThreadBreak), or an extension of an 
// existing plugin (see Emojis).
export const Plugin = Node.create<Options>({
	name: PLUGIN_NAME,
	priority: 1001,

	addAttributes() {
		return {
			// TODO: here is where the attributes for the plugin will go
            // Attributes are properties set on the element in the editor, usually
            // parsed and serialized in the HTML.
			// emojiSet: {
			// 	default: null,
			// 	parseHTML: (element) => element.getAttribute("data-emoji-set"),
			// 	renderHTML: (attributes) => {
			// 		return {
			// 			"data-emoji-set": attributes.emojiSet,
			// 		};
			// 	},
			// },
		};
	},

	addOptions() {
        // TODO: here is where the options for the plugin will go
        // Options are the properties that can be set on the plugin, used to configure
        // it when it's added to the editor.
		return {
		};
	},

	parseHTML() {
        // When the editor is first rendered, it will parse the HTML and look
        // for elements with the tag and attributes specified here. If they
        // match, they'll be handled by the plugin.
		return [
			{
				// tag: `span[data-type=${this.name}]`,
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
        // This is what the plugin will render when one of its element is added to the editor.
        // If the plugin is complex, it may need to be done as a NodeView (see below).
		return [
			// "span",
			// mergeAttributes(HTMLAttributes, {
			// 	"data-type": this.name,
			// 	"aria-label": "text spoilers",
			// 	tabindex: this.options.focusable ? 0 : undefined,
			// }),
			// // This 0 is used to mark where the content is to be inserted (https://tiptap.dev/guide/custom-extensions#render-html)
			// 0,
		];
	},

    // addNodeView() {
    //     return ReactNodeViewRenderer(ThreadBreakNodeView);
    // },

	addCommands() {
		return {
			// setInlineSpoilers:
			// 	(attributes) =>
			// 	({ commands }) => {
			// 		return commands.setMark(this.name, attributes);
			// 	},
			// toggleInlineSpoilers:
			// 	(attributes) =>
			// 	({ commands }) => {
			// 		return commands.toggleMark(this.name, attributes);
			// 	},
			// unsetInlineSpoilers:
			// 	() =>
			// 	({ commands }) => {
			// 		return commands.unsetMark(this.name);
			// 	},
		};
	},

	addInputRules() {
        // Input rules are used to automatically convert text input into the plugin's elements.
		return [
			// markInputRule({
			// 	find: inputRegex,
			// 	type: this.type,
			// }),
		];
	},

	addPasteRules() {
        // Paste rules are used to automatically convert pasted text into the plugin's elements.
		return [
			// markPasteRule({
			// 	find: pasteRegex,
			// 	type: this.type,
			// }),
		];
	},

	addProseMirrorPlugins() {
        // ProseMirror plugins are used to add additional functionality to the editor.
        // They're lower level than TipTap and have more control over the editor's internals.
		return [
			// toggleAttributeOnClick({
			// 	name: this.name,
			// 	attribute: "data-visible",
			// }),
		];
	},
});