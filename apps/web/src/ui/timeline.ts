import type { CityData } from "@canopy/shared";

export interface PlaybackStep {
  frame: number;
  isPlaying: boolean;
}

export function shouldShowTimeSlider(city: CityData | null): boolean {
  return Boolean(city?.timeline && city.timeline.frameCount > 1);
}

export function nextPlaybackFrame(frame: number, frameCount: number): PlaybackStep {
  const finalFrame = Math.max(0, frameCount - 1);
  const nextFrame = Math.min(finalFrame, frame + 1);
  return {
    frame: nextFrame,
    isPlaying: nextFrame < finalFrame,
  };
}

export function formatFrameDate(isoDate: string | undefined): string {
  if (!isoDate) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}
