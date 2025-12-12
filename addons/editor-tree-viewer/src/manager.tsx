import React from "react";

import { AddonPanel } from "storybook/internal/components";
import { addons, types, useChannel } from "storybook/manager-api";

import {
  ADDON_ID,
  EDITOR_VIEWS_PANEL_ACTIVE,
  EDITOR_VIEWS_PANEL_UPDATE,
  PANEL_ID,
} from "./constants.js";
import { Panel } from "./Panel.js";

const PanelWrapper: React.FC<{ active: boolean }> = ({ active }) => {
  const emit = useChannel({});
  const isActive = Boolean(active);

  React.useEffect(() => {
    if (emit) {
      emit(EDITOR_VIEWS_PANEL_UPDATE, { active: isActive });
    }
    localStorage.setItem(EDITOR_VIEWS_PANEL_ACTIVE, String(isActive));
  }, [isActive, emit]);

  return (
    <AddonPanel active={isActive}>
      <Panel active={isActive} />
    </AddonPanel>
  );
};

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    title: "Editor Tree Viewer",
    type: types.PANEL,
    match: ({ viewMode }) => {
      return viewMode === "story";
    },
    render: ({ active }) => <PanelWrapper active={Boolean(active)} />,
  });
});
