import type { DocumentType, JSONContent } from "@tiptap/core";
import type { Heading, Root as MdastRoot } from "mdast";
import { toString } from "mdast-util-to-string";
import { u } from "unist-builder";

import type {
	RootChild as MdastRootChild,
	ParagraphChild,
} from "./mdast-utils.js";
import {
	compact,
	isBlockOrDefinitionContent,
	isParagraphChildNode,
	isRootChildNode,
	normaliseParagraphChildren,
} from "./mdast-utils.js";
import type { ConverterMarkPlugin, ConverterPlugin } from "./plugin-utils.js";
import { applyPluginsMarks, applyPluginsNodes } from "./plugin-utils.js";

export type ProseMirrorMark = NonNullable<JSONContent["marks"]>[number];
export type ProseMirrorNode = JSONContent;
export type ProseMirrorDocument = DocumentType;

export type {
	ConverterContext,
	ConverterMarkPlugin,
	ConverterPlugin,
} from "./plugin-utils.js";

const isDocument = (root: unknown): root is DocumentType =>
	typeof root === "object" &&
	root !== null &&
	"type" in root &&
	root.type === "doc";

const hasContent = (root: unknown): root is { content?: JSONContent[] } =>
	typeof root === "object" && root !== null && "content" in root;

export const convert = (
	root: unknown,
	options?: {
		plugins?: readonly (ConverterPlugin | ConverterMarkPlugin)[];
		acceptPartial?: boolean;
	},
): MdastRoot => {
	const plugins = options?.plugins ?? [];

	let content: JSONContent[];

	if (options?.acceptPartial) {
		if (!hasContent(root)) {
			return u("root", []);
		}
		content = root.content ?? [];
	} else {
		if (!isDocument(root)) {
			throw new Error("Root type is not doc");
		}
		// We're forgiving if the root has no children
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		content = root.content ?? [];
	}

	const convertedChildren: MdastRootChild[] = [];
	for (let index = 0; index < content.length; index++) {
		const node = content[index];
		convertedChildren.push(
			convertBlockNode(node, content[index - 1], content[index + 1], plugins),
		);
	}

	const candidateRoot = u("root", convertedChildren);

	compact(candidateRoot);
	return candidateRoot;
};

/**
 * Converts a ProseMirror block-level node to an mdast node.
 * Handles paragraphs, code blocks, images, headings, blockquotes, lists, and horizontal rules.
 * Uses plugins for unknown node types.
 */
const convertBlockNode = (
	node: JSONContent,
	previousSibling: JSONContent | undefined,
	nextSibling: JSONContent | undefined,
	plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[],
): MdastRootChild => {
	switch (node.type) {
		case "paragraph": {
			const paragraphChildren: ParagraphChild[] = [];
			const inlineContent = node.content ?? [];
			for (let index = 0; index < inlineContent.length; index++) {
				const contentNode = inlineContent[index];
				paragraphChildren.push(
					...convertInlineNode(
						contentNode,
						inlineContent[index - 1],
						inlineContent[index + 1],
						plugins,
					),
				);
			}

			const normalisedChildren = normaliseParagraphChildren(
				paragraphChildren,
				previousSibling,
				nextSibling,
			);

			return u("paragraph", normalisedChildren);
		}
		case "codeBlock": {
			const language =
				typeof node.attrs?.language === "string"
					? node.attrs.language
					: undefined;
			const [firstChild] = node.content ?? [];
			const value = typeof firstChild?.text === "string" ? firstChild.text : "";

			return language ? u("code", { lang: language }, value) : u("code", value);
		}
		case "image": {
			const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
			const title =
				typeof node.attrs?.title === "string" ? node.attrs.title : undefined;
			const alt =
				typeof node.attrs?.alt === "string" ? node.attrs.alt : undefined;

			return u("image", { url: src, title: title ?? null, alt: alt ?? null });
		}
		case "heading": {
			const depth =
				typeof node.attrs?.level === "number" ? node.attrs.level : 1;
			const paragraphChildren: ParagraphChild[] = [];
			const inlineContent = node.content ?? [];
			for (let index = 0; index < inlineContent.length; index++) {
				const contentNode = inlineContent[index];
				paragraphChildren.push(
					...convertInlineNode(
						contentNode,
						inlineContent[index - 1],
						inlineContent[index + 1],
						plugins,
					),
				);
			}

			return u(
				"heading",
				{ depth: depth as Heading["depth"] },
				paragraphChildren,
			);
		}
		case "blockquote": {
			const convertedChildren: MdastRootChild[] = [];
			const blockContent = node.content ?? [];
			for (let index = 0; index < blockContent.length; index++) {
				const child = blockContent[index];
				convertedChildren.push(
					convertBlockNode(
						child,
						blockContent[index - 1],
						blockContent[index + 1],
						plugins,
					),
				);
			}

			return u(
				"blockquote",
				convertedChildren.filter(isBlockOrDefinitionContent),
			);
		}
		case "bulletList": {
			const listItems = node.content ?? [];

			return u("list", { ordered: false, spread: false }, [
				...listItems.map((item) => {
					const itemChildren: MdastRootChild[] = [];
					const itemContent = item.content ?? [];
					for (let index = 0; index < itemContent.length; index++) {
						const child = itemContent[index];
						itemChildren.push(
							convertBlockNode(
								child,
								itemContent[index - 1],
								itemContent[index + 1],
								plugins,
							),
						);
					}

					return u("listItem", itemChildren.filter(isBlockOrDefinitionContent));
				}),
			]);
		}
		case "orderedList": {
			const listItems = node.content ?? [];
			const start =
				typeof node.attrs?.start === "number" && !Number.isNaN(node.attrs.start)
					? node.attrs.start
					: undefined;

			return u("list", { ordered: true, spread: false, start }, [
				...listItems.map((item) => {
					const itemChildren: MdastRootChild[] = [];
					const itemContent = item.content ?? [];
					for (let index = 0; index < itemContent.length; index++) {
						const child = itemContent[index];
						itemChildren.push(
							convertBlockNode(
								child,
								itemContent[index - 1],
								itemContent[index + 1],
								plugins,
							),
						);
					}

					return u("listItem", itemChildren.filter(isBlockOrDefinitionContent));
				}),
			]);
		}
		case "horizontalRule": {
			return u("thematicBreak");
		}
		default: {
			const converted = applyPluginsNodes(node, plugins);
			if (!converted) {
				console.warn(`Unknown node type: ${node.type}`);
				throw new Error(`Unknown node type: ${node.type}`);
			}
			if (isRootChildNode(converted)) {
				return converted;
			}

			if (isParagraphChildNode(converted)) {
				return u("paragraph", [converted]);
			}

			throw new Error(
				`Plugin returned an unsupported node type for block context: ${converted.type}`,
			);
		}
	}
};

/**
 * Converts a ProseMirror inline node to an array of mdast paragraph children.
 * Handles text nodes, hard breaks, and delegates to plugins for other inline types.
 */
const convertInlineNode = (
	node: JSONContent,
	previousSibling: JSONContent | undefined,
	nextSibling: JSONContent | undefined,
	plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[],
): ParagraphChild[] => {
	if (node.type === "text") {
		return convertTextNode(node, previousSibling, nextSibling, plugins);
	}

	if (node.type === "hardBreak") {
		return [u("break")];
	}

	const converted = applyPluginsNodes(node, plugins);
	if (!converted) {
		throw new Error(`Unknown inline node type: ${node.type}`);
	}

	if (isParagraphChildNode(converted)) {
		return [converted];
	}

	if (isRootChildNode(converted)) {
		throw new Error(
			`Plugin returned a block node when inline content was expected: ${converted.type}`,
		);
	}

	throw new Error(
		`Plugin returned an unsupported inline node type: ${converted.type}`,
	);
};

/**
 * Converts a ProseMirror text node with marks to mdast nodes.
 * Handles bold, italic, code, underline, and link marks.
 * Uses plugins for unknown mark types.
 */
const convertTextNode = (
	node: JSONContent,
	_previousSibling: JSONContent | undefined,
	_nextSibling: JSONContent | undefined,
	plugins: readonly (ConverterPlugin | ConverterMarkPlugin)[],
): ParagraphChild[] => {
	if (typeof node.text !== "string") {
		throw new TypeError("Text node is missing textual content");
	}

	let phrasing: ParagraphChild = u("text", node.text);
	const tags: string[] = [];
	for (const mark of node.marks?.toReversed() ?? []) {
		switch (mark.type) {
			case "bold": {
				phrasing = u("strong", [phrasing]);
				break;
			}
			case "italic": {
				phrasing = u("emphasis", [phrasing]);
				break;
			}
			case "code": {
				phrasing = u("inlineCode", { value: node.text });
				break;
			}
			case "underline": {
				phrasing = u("text", toString(phrasing));
				tags.push("u");
				break;
			}
			case "link": {
				const href =
					typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
				const title =
					typeof mark.attrs?.title === "string" ? mark.attrs.title : undefined;
				phrasing = u("link", { url: href, title: title ?? null }, [phrasing]);
				break;
			}
			default: {
				const converted = applyPluginsMarks(mark, node, phrasing, plugins);
				if (!converted) {
					console.warn(`Unknown mark type: ${mark.type}`);
					continue;
				}
				// TODO: figure out how to deal with nodes that aren't a single paragraph child
				if (Array.isArray(converted)) {
					console.warn(
						`Plugin returned an array of nodes, which is a case we haven't worked out yet: ${converted.map((node) => node.type).join(", ")}`,
					);
				}
				phrasing = converted as ParagraphChild;
				continue;
			}
		}
	}
	if (tags.length > 0) {
		return [
			tags.map((tag) => u("html", { value: `<${tag}>` })),
			phrasing,
			tags.map((tag) => u("html", { value: `</${tag}>` })),
		].flat();
	}
	return [phrasing];
};
