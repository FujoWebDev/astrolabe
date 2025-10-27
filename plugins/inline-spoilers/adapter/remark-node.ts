// This file is a copy of the emphasis plugin from mdast-util-to-markdown.
// See: https://github.com/syntax-tree/mdast-util-to-markdown/blob/main/lib/handle/emphasis.js

import type { Parents, PhrasingContent } from "mdast";
import type { Info, State } from "mdast-util-to-markdown";
import { classifyCharacter } from "micromark-util-classify-character";

declare module "mdast" {
	interface RootContentMap {
		spoilers: SpoilersNode;
	}
}

interface SpoilersNode {
	type: "spoilers";
	children: PhrasingContent[];
}

declare module "mdast-util-to-markdown" {
	interface ConstructNameMap {
		spoilers: "spoilers";
	}
}

/**
 * Check whether to encode (as a character reference) the characters
 * surrounding an attention run.
 *
 * Which characters are around an attention run influence whether it works or
 * not.
 *
 * See <https://github.com/orgs/syntax-tree/discussions/60> for more info.
 * See this markdown in a particular renderer to see what works:
 *
 * ```markdown
 * |                         | A (letter inside) | B (punctuation inside) | C (whitespace inside) | D (nothing inside) |
 * | ----------------------- | ----------------- | ---------------------- | --------------------- | ------------------ |
 * | 1 (letter outside)      | x*y*z             | x*.*z                  | x* *z                 | x**z               |
 * | 2 (punctuation outside) | .*y*.             | .*.*.                  | .* *.                 | .**.               |
 * | 3 (whitespace outside)  | x *y* z           | x *.* z                | x * * z               | x ** z             |
 * | 4 (nothing outside)     | *x*               | *.*                    | * *                   | **                 |
 * ```
 *
 * @param {number} outside
 *   Code point on the outer side of the run.
 * @param {number} inside
 *   Code point on the inner side of the run.
 * @param {'*' | '_'} marker
 *   Marker of the run.
 *   Underscores are handled more strictly (they form less often) than
 *   asterisks.
 * @returns {EncodeSides}
 *   Whether to encode characters.
 */
// Important: punctuation must never be encoded.
// Punctuation is solely used by markdown constructs.
// And by encoding itself.
// Encoding them will break constructs or double encode things.
export function encodeInfo(outside: number, inside: number, marker: string) {
	const outsideKind = classifyCharacter(outside);
	const insideKind = classifyCharacter(inside);

	// Letter outside:
	if (outsideKind === undefined) {
		return insideKind === undefined
			? // Letter inside:
				// we have to encode *both* letters for `_` as it is looser.
				// it already forms for `*` (and GFMs `~`).
				marker === "_"
				? { inside: true, outside: true }
				: { inside: false, outside: false }
			: insideKind === 1
				? // Whitespace inside: encode both (letter, whitespace).
					{ inside: true, outside: true }
				: // Punctuation inside: encode outer (letter)
					{ inside: false, outside: true };
	}

	// Whitespace outside:
	if (outsideKind === 1) {
		return insideKind === undefined
			? // Letter inside: already forms.
				{ inside: false, outside: false }
			: insideKind === 1
				? // Whitespace inside: encode both (whitespace).
					{ inside: true, outside: true }
				: // Punctuation inside: already forms.
					{ inside: false, outside: false };
	}

	// Punctuation outside:
	return insideKind === undefined
		? // Letter inside: already forms.
			{ inside: false, outside: false }
		: insideKind === 1
			? // Whitespace inside: encode inner (whitespace).
				{ inside: true, outside: false }
			: // Punctuation inside: already forms.
				{ inside: false, outside: false };
}

/**
 * Encode a code point as a character reference.
 *
 * @param {number} code
 *   Code point to encode.
 * @returns {string}
 *   Encoded character reference.
 */
export function encodeCharacterReference(code: number): string {
	return `&#x${code.toString(16).toUpperCase()};`;
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Emphasis, Parents} from 'mdast'
 */

spoilers.peek = () => "||";

/**
 * @param {Emphasis} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
export function spoilers(
	node: SpoilersNode,
	_: Parents | undefined,
	state: State,
	info: Info,
): string {
	const marker = "||";
	const exit = state.enter("spoilers");
	const tracker = state.createTracker(info);
	const before = tracker.move(marker);

	let between = tracker.move(
		state.containerPhrasing(node, {
			after: marker,
			before,
			...tracker.current(),
		}),
	);
	const betweenHead = between.charCodeAt(0);
	const open = encodeInfo(
		info.before.charCodeAt(info.before.length - 1),
		betweenHead,
		marker,
	);

	if (open.inside) {
		between = encodeCharacterReference(betweenHead) + between.slice(1);
	}

	const betweenTail = between.charCodeAt(between.length - 1);
	const close = encodeInfo(info.after.charCodeAt(0), betweenTail, marker);

	if (close.inside) {
		between = between.slice(0, -1) + encodeCharacterReference(betweenTail);
	}

	const after = tracker.move(marker);

	exit();

	state.attentionEncodeSurroundingInfo = {
		after: close.outside,
		before: open.outside,
	};
	return before + between + after;
}
