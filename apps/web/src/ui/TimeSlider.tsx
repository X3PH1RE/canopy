import type { CityData } from "@canopy/shared";
import { useCityStore } from "../store";
import { formatFrameDate, shouldShowTimeSlider } from "./timeline";

interface TimeSliderProps {
  city: CityData | null;
}

export function TimeSlider({ city }: TimeSliderProps) {
  const timelineFrame = useCityStore((state) => state.timelineFrame);
  const isTimelinePlaying = useCityStore((state) => state.isTimelinePlaying);
  const setTimelineFrame = useCityStore((state) => state.setTimelineFrame);
  const setTimelinePlaying = useCityStore((state) => state.setTimelinePlaying);

  if (!shouldShowTimeSlider(city) || !city?.timeline) {
    return null;
  }

  const maxFrame = city.timeline.frameCount - 1;
  const currentDate = formatFrameDate(city.timeline.frameDates[timelineFrame]);

  return (
    <section className="time-slider" aria-label="Repository history timeline">
      <button
        className="time-play"
        type="button"
        aria-label={isTimelinePlaying ? "Pause timeline" : "Play timeline"}
        onClick={() => setTimelinePlaying(!isTimelinePlaying)}
      >
        {isTimelinePlaying ? "Pause" : "Play"}
      </button>
      <input
        aria-label="Timeline frame"
        max={maxFrame}
        min={0}
        onChange={(event) => setTimelineFrame(Number(event.currentTarget.value))}
        type="range"
        value={timelineFrame}
      />
      <time dateTime={city.timeline.frameDates[timelineFrame]}>{currentDate}</time>
    </section>
  );
}
