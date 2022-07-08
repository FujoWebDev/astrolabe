interface EditorProps {
  editable: boolean;
  initialContent: string;
}
export const Editor = (props: EditorProps) => {
  return <div>{props.initialContent}</div>;
};
