import {
	Mark,
	markInputRule,
	markPasteRule,
	mergeAttributes,
} from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { toggleAttributeOnClick } from "./utils";

export interface Options {
	visible?: boolean;
	focusable?: boolean;
}

export const Key = new PluginKey("InlineSpoilersPlugin");

export const PLUGIN_NAME = "inline-spoilers";
declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		[PLUGIN_NAME]: {
			setInlineSpoilers: (attributes?: { visible: boolean }) => ReturnType;
			toggleInlineSpoilers: (attributes?: { visible: boolean }) => ReturnType;
			unsetInlineSpoilers: () => ReturnType;
		};
	}
}

// These regex detect the use of || as pseudo-markdown shortcut for applying inline spoilers
// i.e. ||text to be spoilered||, when typed in and pasted in respectively.
// Adapted from the regex used for the strikethough extension here:
// https://github.com/ueberdosis/tiptap/blob/781cdfa54ebd1ba4733f63bb9d5844a59703a7e8/packages/extension-strike/src/strike.ts#L31
export const inputRegex = /(?:^|\s)((?:\|\|)((?:[^|]+))(?:\|\|))$/;
export const pasteRegex = /(?:^|\s)((?:\|\|)((?:[^|]+))(?:\|\|))/g;

export const Plugin = Mark.create<Options>({
	name: PLUGIN_NAME,
	priority: 1001,

	addAttributes() {
		return {
			visible: {
				default: false,
				parseHTML: (element) => element.getAttribute("data-visible"),
				renderHTML: (attributes) => {
					return {
						"data-visible": attributes.visible,
					};
				},
			},
		};
	},

	addOptions() {
		return {
			// Editing functions break if you add tabindex=0,
			// which we want in the view only state to allow revealing spoilers via keyboard navigation,
			// but we can't directly access this.editor in renderHTML so it needs to be set via configuration based on the editor props.
			focusable: false,
		};
	},

	parseHTML() {
		return [
			{
				tag: `span[data-type=${this.name}]`,
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"span",
			mergeAttributes(HTMLAttributes, {
				"data-type": this.name,
				"aria-label": "text spoilers",
				tabindex: this.options.focusable ? 0 : undefined,
			}),
			// This 0 is used to mark where the content is to be inserted (https://tiptap.dev/guide/custom-extensions#render-html)
			0,
		];
	},

	addCommands() {
		return {
			setInlineSpoilers:
				(attributes) =>
				({ commands }) => {
					return commands.setMark(this.name, attributes);
				},
			toggleInlineSpoilers:
				(attributes) =>
				({ commands }) => {
					return commands.toggleMark(this.name, attributes);
				},
			unsetInlineSpoilers:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			"Alt-Shift-r": () => this.editor.commands.toggleInlineSpoilers(),
		};
	},

	addInputRules() {
		return [
			markInputRule({
				find: inputRegex,
				type: this.type,
			}),
		];
	},

	addPasteRules() {
		return [
			markPasteRule({
				find: pasteRegex,
				type: this.type,
			}),
		];
	},

	addProseMirrorPlugins() {
		return [
			toggleAttributeOnClick({
				name: this.name,
				attribute: "data-visible",
			}),
		];
	},
});
