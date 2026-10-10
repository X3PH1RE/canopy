import { describe, expect, it } from "vitest";
import { createKeyTracker, isEditableTarget } from "./keys";

function target(tagName: string, options: { isContentEditable?: boolean; role?: string } = {}): EventTarget {
  return {
    tagName,
    isContentEditable: options.isContentEditable ?? false,
    getAttribute: (name: string) => (name === "role" ? options.role ?? null : null),
  } as unknown as EventTarget;
}

describe("input key helpers", () => {
  it("treats text-entry targets as editable", () => {
    expect(isEditableTarget(target("input"))).toBe(true);
    expect(isEditableTarget(target("TEXTAREA"))).toBe(true);
    expect(isEditableTarget(target("select"))).toBe(true);
    expect(isEditableTarget(target("div", { isContentEditable: true }))).toBe(true);
    expect(isEditableTarget(target("div", { role: "textbox" }))).toBe(true);
    expect(isEditableTarget(target("button"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });

  it("normalizes pressed keys and clears them on blur", () => {
    const tracker = createKeyTracker();

    tracker.press("W");
    tracker.press("Shift");
    tracker.press(" ");

    expect(tracker.snapshot()).toMatchObject({
      forward: true,
      boost: true,
      space: true,
    });

    tracker.release("w");
    expect(tracker.snapshot().forward).toBe(false);

    tracker.clear();
    expect(tracker.snapshot()).toEqual({
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      boost: false,
      toggleFly: false,
      expand: false,
      escape: false,
      space: false,
      digit: null,
      yawLeft: false,
      yawRight: false,
    });
  });
});
