import React, { useCallback, useRef } from "react";
// TODO: get all platforms from Node.tsx
import { ALL_PLATFORMS, type PlatformKey } from "./Node.js";

export function ThreadBreakPopover({
  initialBreakOn = ["bsky", "twitter"],
  onChange,
  editable,
}: {
  initialSkipOn?: PlatformKey[];
  initialBreakOn?: PlatformKey[];
  onChange?: (options: Partial<Record<PlatformKey, "skip" | "break">>) => void;
  editable: boolean;
}) {
  const fieldSetRef = useRef<HTMLFieldSetElement>(null);
  const handlePlatformToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const options: Partial<Record<PlatformKey, "skip" | "break">> = {};
      Array.from(fieldSetRef.current?.elements ?? []).forEach((element) => {
        if (
          element instanceof HTMLInputElement &&
          element.name in ALL_PLATFORMS
        ) {
          options[element.name as PlatformKey] = element.checked
            ? "break"
            : "skip";
        }
      });
      onChange?.(options);
    },
    [fieldSetRef]
  );
  const getPlatformDisplayName = (platform: PlatformKey): string => {
    const names: Record<PlatformKey, string> = {
      mastodon: "Mastodon",
      tumblr: "Tumblr",
      bsky: "Bluesky",
      twitter: "X (Twitter)",
    };
    return names[platform] || platform;
  };

  return (
    <div>
      <div>
        <fieldset ref={fieldSetRef}>
          <legend>Break on:</legend>
          {ALL_PLATFORMS.map((platform) => (
            <div key={platform}>
              <label>
                {getPlatformDisplayName(platform)}
                <input
                  type="checkbox"
                  name={platform}
                  defaultChecked={initialBreakOn.includes(platform)}
                  disabled={!editable}
                  onChange={handlePlatformToggle}
                />
              </label>
            </div>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
