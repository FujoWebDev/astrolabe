import {
	Mark,
	markInputRule,
	markPasteRule,
	mergeAttributes,
} from "@tiptap/core";
import {ReactMarkViewRenderer } from '@tiptap/react';

import { PluginKey } from "@tiptap/pm/state";
import { 
	toggleAttributeOnClick,
	toggleAttributeOnFocusKey 
} from "./utils";
import "./inline-spoilers.css";

export interface Options {
	visible?: boolean;
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
				parseHTML: (element) => (element.getAttribute("aria-expanded") === 'true'),
				renderHTML: (attributes) => {
					return {
						"aria-expanded": attributes.visible,
					};
				},
			},
		};
	},

	addOptions() {
		return { };
	},

	parseHTML() {
		return [
			{
				tag: `button[data-type=${this.name}]`,
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		let returnHTML = [
			"button",
			mergeAttributes(HTMLAttributes, {
				"data-type": this.name,
				// "title" is used instead of "aria-label" because this way, when the
				// spoiler is revealed, it just says it outright instead of repeating
				// the "aria-label" value
				//"title": "Text Spoilers",
				"tabindex": this.editor.options.editable ? undefined : 0,
				"disabled": this.editor.options.editable ? 0 : undefined,
			}),
		];
		// only return special screenreader span if not editable
		if (!this.editor.options.editable) {
			returnHTML.push(
				[
					"span",
					{"class": "sr-only"},
					"text spoilers",
				],
			);
		}
		returnHTML.push(
			[
				"span", 
				{"class": "content"},
				// This 0 is used to mark where the content is to be inserted (https://tiptap.dev/guide/custom-extensions#render-html)
				0,
			]
		);
		return returnHTML;
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
				attribute: "aria-expanded",
			}),
			toggleAttributeOnFocusKey({
				name: this.name,
				attribute: "aria-expanded",
			}),
		];
	},
});
