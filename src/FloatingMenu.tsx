import { AddMediaImage } from "iconoir-react";
import React from "react";

export const FloatingMenuOptions = (props: {}) => {
  return (
    <ul role="menubar">
      <li role="menuitem">
        <button aria-label="Add image">
          <AddMediaImage />
        </button>
      </li>
    </ul>
  );
};
