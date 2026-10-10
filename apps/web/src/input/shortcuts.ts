import type { ViewMode } from "../scene/model";
import { isEditableTarget } from "./keys";

export type ShortcutAction =
  | { type: "viewMode"; viewMode: ViewMode }
  | { type: "toggleRoads" }
  | { type: "togglePlayback" };

export function shortcutActionForKey(key: string, target: EventTarget | null): ShortcutAction | null {
  if (isEditableTarget(target)) {
    return null;
  }

  const normalized = key.toLowerCase();
  if (normalized === "1") return { type: "viewMode", viewMode: "language" };
  if (normalized === "2") return { type: "viewMode", viewMode: "churn" };
  if (normalized === "3") return { type: "viewMode", viewMode: "complexity" };
  if (normalized === "4") return { type: "viewMode", viewMode: "risk" };
  if (normalized === "r") return { type: "toggleRoads" };
  if (key === " ") return { type: "togglePlayback" };
  return null;
}
