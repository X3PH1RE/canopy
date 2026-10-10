import { describe, expect, it } from "vitest";
import { shouldStartOrbitFocus } from "./CameraRig";

describe("camera rig helpers", () => {
  it("ignores focus requests while drone fly mode owns the camera", () => {
    expect(shouldStartOrbitFocus({ fileId: 1, nonce: 1 }, true)).toBe(false);
    expect(shouldStartOrbitFocus({ fileId: 1, nonce: 1 }, false)).toBe(true);
    expect(shouldStartOrbitFocus(null, false)).toBe(false);
  });
});
