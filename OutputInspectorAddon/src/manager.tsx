import { addons, types } from "@storybook/addons";

import { AddonPanel } from "@storybook/components";
import { OutputInspector } from "./OutputInspector";
import React from "react";

addons.register("output-inspector", () => {
  addons.add("output-inspector", {
    title: "Output Inspector",
    //👇 Sets the type of UI element in Storybook
    type: types.PANEL,
    match: ({ viewMode }) => {
      return viewMode === "story";
    },
    render: ({ active }) => {
      return (
        <AddonPanel active={!!active}>
          <OutputInspector />
        </AddonPanel>
      );
    },
    paramKey: "outputInspector",
  });
});
