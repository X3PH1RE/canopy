import { describe, expect, it } from "vitest";
import type { CityData } from "@canopy/shared";
import { formatFrameDate, nextPlaybackFrame, shouldShowTimeSlider } from "./timeline";

describe("timeline UI helpers", () => {
  it("hides the slider when a city has no timeline", () => {
    expect(shouldShowTimeSlider({ timeline: null } as CityData)).toBe(false);
    expect(shouldShowTimeSlider({ timeline: { frameCount: 100 } } as CityData)).toBe(true);
  });

  it("advances playback and stops cleanly at the final frame", () => {
    expect(nextPlaybackFrame(0, 4)).toEqual({ frame: 1, isPlaying: true });
    expect(nextPlaybackFrame(2, 4)).toEqual({ frame: 3, isPlaying: false });
    expect(nextPlaybackFrame(3, 4)).toEqual({ frame: 3, isPlaying: false });
  });

  it("formats frame dates as compact readable labels", () => {
    expect(formatFrameDate("2024-09-14T12:30:00.000Z")).toBe("Sep 14, 2024");
  });
});
