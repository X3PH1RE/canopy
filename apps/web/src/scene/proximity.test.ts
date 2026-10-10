import { describe, expect, it } from "vitest";
import { PROXIMITY_DWELL_MS, PROXIMITY_RELEASE_MS, initialProximityState, updateProximity } from "./proximity";

describe("proximity state machine", () => {
  it("activates one popup after a stable dwell", () => {
    let state = initialProximityState();

    state = updateProximity(state, { nearestId: 4, nowMs: 1000, speed: 1 });
    expect(state.activeId).toBeNull();

    state = updateProximity(state, { nearestId: 4, nowMs: 1000 + PROXIMITY_DWELL_MS, speed: 1 });
    expect(state.activeId).toBe(4);
  });

  it("does not activate during fast flybys", () => {
    let state = initialProximityState();

    state = updateProximity(state, { nearestId: 7, nowMs: 2000, speed: 9 });
    state = updateProximity(state, { nearestId: 7, nowMs: 2000 + PROXIMITY_DWELL_MS + 20, speed: 9 });

    expect(state.activeId).toBeNull();
  });

  it("hides the active popup after leaving release range", () => {
    let state = updateProximity(initialProximityState(), { nearestId: 3, nowMs: 0, speed: 0 });
    state = updateProximity(state, { nearestId: 3, nowMs: PROXIMITY_DWELL_MS, speed: 0 });
    expect(state.activeId).toBe(3);

    state = updateProximity(state, { nearestId: null, nowMs: PROXIMITY_DWELL_MS + 100, speed: 0 });
    expect(state.activeId).toBe(3);

    state = updateProximity(state, { nearestId: null, nowMs: PROXIMITY_DWELL_MS + 100 + PROXIMITY_RELEASE_MS, speed: 0 });
    expect(state.activeId).toBeNull();
  });

  it("resets dwell when the nearest building changes", () => {
    let state = updateProximity(initialProximityState(), { nearestId: 1, nowMs: 0, speed: 0 });
    state = updateProximity(state, { nearestId: 2, nowMs: PROXIMITY_DWELL_MS - 10, speed: 0 });
    state = updateProximity(state, { nearestId: 2, nowMs: PROXIMITY_DWELL_MS, speed: 0 });

    expect(state.activeId).toBeNull();

    state = updateProximity(state, { nearestId: 2, nowMs: PROXIMITY_DWELL_MS * 2, speed: 0 });
    expect(state.activeId).toBe(2);
  });
});
