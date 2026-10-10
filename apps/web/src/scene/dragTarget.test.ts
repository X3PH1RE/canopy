import { describe, expect, it } from "vitest";
import { isFlyDragTarget } from "./DroneController";

function target(selector: string | null): EventTarget {
  return {
    closest: (query: string) => (selector && query.includes(selector) ? {} : null),
  } as unknown as EventTarget;
}

describe("fly drag target guard", () => {
  it("ignores overlay pointer targets", () => {
    expect(isFlyDragTarget(target(".search-box"))).toBe(false);
    expect(isFlyDragTarget(target(null))).toBe(true);
  });
});
