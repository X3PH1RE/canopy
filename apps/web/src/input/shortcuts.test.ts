import { describe, expect, it } from "vitest";
import { shouldHandleShortcutEvent, shortcutActionForKey } from "./shortcuts";

function target(tagName: string): EventTarget {
  return {
    tagName,
    isContentEditable: false,
    getAttribute: () => null,
  } as unknown as EventTarget;
}

describe("keyboard shortcuts", () => {
  it("maps global shortcuts outside editable fields", () => {
    expect(shortcutActionForKey("1", target("body"))).toEqual({ type: "viewMode", viewMode: "language" });
    expect(shortcutActionForKey("2", target("body"))).toEqual({ type: "viewMode", viewMode: "churn" });
    expect(shortcutActionForKey("3", target("body"))).toEqual({ type: "viewMode", viewMode: "complexity" });
    expect(shortcutActionForKey("4", target("body"))).toEqual({ type: "viewMode", viewMode: "risk" });
    expect(shortcutActionForKey("r", target("body"))).toEqual({ type: "toggleRoads" });
    expect(shortcutActionForKey(" ", target("body"))).toEqual({ type: "togglePlayback" });
  });

  it("ignores shortcuts while typing", () => {
    expect(shortcutActionForKey("1", target("input"))).toBeNull();
    expect(shortcutActionForKey("r", target("textarea"))).toBeNull();
  });

  it("ignores repeated keydown events", () => {
    expect(shouldHandleShortcutEvent({ key: "r", repeat: true, target: target("body") })).toBeNull();
    expect(shouldHandleShortcutEvent({ key: "r", repeat: false, target: target("body") })).toEqual({ type: "toggleRoads" });
  });
});
