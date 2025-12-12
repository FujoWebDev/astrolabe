import type { DocumentType } from "@tiptap/core";
import { useCurrentEditor } from "@tiptap/react";
import type { Root } from "mdast";
import React from "react";
import {
	type ConverterMarkPlugin,
	type ConverterPlugin,
	toMdast,
} from "../src/index.js";

export const useEditorToMdast = (
	jsonDocPlugins: readonly (ConverterPlugin | ConverterMarkPlugin)[],
) => {
	const { editor } = useCurrentEditor();
	const [record, setRecord] = React.useState<Root>({
		type: "root",
		children: [],
	});

	React.useEffect(() => {
		if (!editor) {
			return;
		}
		const convertAndSetResult = () => {
			const editorJson = editor.getJSON();
			if (editorJson) {
				const mdastRecord = toMdast(
					structuredClone(editorJson) as DocumentType,
					{
						plugins: jsonDocPlugins,
					},
				);

				setRecord(mdastRecord);
			}
		};
		editor?.on("create", convertAndSetResult);
		editor?.on("update", convertAndSetResult);
		return () => {
			editor?.off("create", convertAndSetResult);
			editor?.off("update", convertAndSetResult);
		};
	}, [editor, jsonDocPlugins]);

	return record;
};
