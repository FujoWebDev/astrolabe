import React from "react";
import { css } from "@linaria/core";

interface ToggleButtonProps {
  title: string;
  value: boolean;
  onValueChange: (
    nextValue: boolean,
    originalEvent:
      | React.FormEvent<HTMLInputElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => void;
  children: React.ReactNode;
}

interface ButtonProps {
  title: string;
  onClick: (
    originalEvent: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
  children: React.ReactNode;
}

type SettingTypes = ButtonProps | ToggleButtonProps;

export interface BlockSettingsMenuProps {
  children:
    | React.ReactElement<SettingTypes>
    | React.ReactElement<SettingTypes>[];
}

export const Button = (props: ButtonProps) => {
  return (
    <button title={props.title} onClick={(e) => props.onClick(e)}>
      {props.children}
    </button>
  );
};

export const ToggleButton = (props: ToggleButtonProps) => {
  return (
    <label>
      <input
        checked={!!props.value}
        type="checkbox"
        title={props.title}
        onChangeCapture={(e) => props.onValueChange(e.currentTarget.checked, e)}
        onKeyDownCapture={(e) => {
          if (e.key == "Enter") {
            props.onValueChange(!props.value, e);
          }
        }}
      />
      {props.children}
    </label>
  );
};

const menuStyle = css`
  display: flex;
  background-color: red;
`;

export const BlockSettingsMenu = (props: BlockSettingsMenuProps) => {
  return (
    <ul role="menubar" className={menuStyle}>
      {React.Children.map(props.children, (child) => (
        <li role="menuitem" key={child.props.title}>
          {child}
        </li>
      ))}
    </ul>
  );
};
