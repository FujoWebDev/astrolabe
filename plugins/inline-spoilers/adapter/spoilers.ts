import type {
	ConverterMarkPlugin,
	ProseMirrorMark,
} from "@fujocoded/astdapters-mdast-starter";

function rot13(str: string) {
	return str.replace(/[a-zA-Z]/g, (char) => {
		const isUpperCase = char === char.toUpperCase();
		const startCharCode = isUpperCase ? "A".charCodeAt(0) : "a".charCodeAt(0);
		const charOffset = char.charCodeAt(0) - startCharCode;
		const rotatedOffset = (charOffset + 13) % 26;
		return String.fromCharCode(startCharCode + rotatedOffset);
	});
}

export const toMdastNode: ConverterMarkPlugin = {
	pluginType: "converter-mark",
	// See: https://github.com/hlysine/remark-inline-spoiler
	handlesMark: (mark: ProseMirrorMark): boolean =>
		mark.type === "inline-spoilers",
	// convert: (_mark, node, currentNode) => ({
	//   type: "spoilers",
	//   children: currentNode,
	// }),
	convert: (_mark, _node, currentNode) => ({
		type: "spoilers",
		data: {
			astrolabe: {
				mergeAdjacentInlineNodes: true,
			},
		},
		// TODO: figure out if this is correct or what the type should be
		// @ts-expect-error
		children: Array.isArray(currentNode) ? currentNode : [currentNode],
	}),
};

export const toRot13Text: ConverterMarkPlugin = {
	pluginType: "converter-mark",
	handlesMark: (mark: ProseMirrorMark): boolean =>
		mark.type === "inline-spoilers",
	convert: (_mark, node) => ({
		type: "text",
		value: `(rot13) ${rot13(node.text ?? "")}`,
	}),
};
