import { useEffect, useState } from "react";
import { getCity, getJob, getLimits, loadSampleCity, RateLimitError, startAnalysis, type JobResponse, type LimitState } from "./api";
import { City } from "./scene/City";
import { useCityStore } from "./store";
import { InspectPanel } from "./ui/InspectPanel";
import { ProgressOverlay } from "./ui/ProgressOverlay";
import { SearchBox } from "./ui/SearchBox";
import { FlyHud } from "./ui/FlyHud";
import { TimeSlider } from "./ui/TimeSlider";
import { Toolbar } from "./ui/Toolbar";
import { UrlBar } from "./ui/UrlBar";
import { nextPlaybackFrame } from "./ui/timeline";

export function App() {
  const city = useCityStore((state) => state.city);
  const error = useCityStore((state) => state.error);
  const selectedId = useCityStore((state) => state.selectedId);
  const timelineFrame = useCityStore((state) => state.timelineFrame);
  const isTimelinePlaying = useCityStore((state) => state.isTimelinePlaying);
  const setCity = useCityStore((state) => state.setCity);
  const setError = useCityStore((state) => state.setError);
  const setTimelineFrame = useCityStore((state) => state.setTimelineFrame);
  const setTimelinePlaying = useCityStore((state) => state.setTimelinePlaying);
  const [isLoading, setIsLoading] = useState(false);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [limits, setLimits] = useState<LimitState | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  async function loadCity() {
    setIsLoading(true);
    setJob(null);
    setRateLimitMessage(null);
    try {
      setCity(await loadSampleCity());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load sample city");
    } finally {
      setIsLoading(false);
    }
  }

  async function analyzeRepo(repoUrl: string) {
    setIsLoading(true);
    setJob({ status: "queued", stage: "queued", progress: 0 });
    setRateLimitMessage(null);
    try {
      const started = await startAnalysis(repoUrl);
      await pollJob(started.jobId);
      setLimits(await getLimits());
    } catch (analyzeError) {
      if (analyzeError instanceof RateLimitError) {
        setRateLimitMessage(analyzeError.message);
        setLimits(await getLimits());
      } else {
        setError(analyzeError instanceof Error ? analyzeError.message : "Could not analyze repository");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function pollJob(jobId: string) {
    for (;;) {
      const nextJob = await getJob(jobId);
      setJob(nextJob);

      if (nextJob.status === "done") {
        setCity(await getCity(jobId));
        return;
      }

      if (nextJob.status === "error") {
        throw new Error(nextJob.error ?? "Analysis failed");
      }

      await delay(800);
    }
  }

  useEffect(() => {
    void loadCity();
  }, []);

  useEffect(() => {
    if (!city?.timeline || !isTimelinePlaying) {
      return undefined;
    }

    const frameMs = 15_000 / Math.max(1, city.timeline.frameCount - 1);
    const timer = window.setInterval(() => {
      const next = nextPlaybackFrame(useCityStore.getState().timelineFrame, city.timeline!.frameCount);
      setTimelineFrame(next.frame);
      setTimelinePlaying(next.isPlaying);
    }, frameMs);

    return () => window.clearInterval(timer);
  }, [city, isTimelinePlaying, timelineFrame, setTimelineFrame, setTimelinePlaying]);

  return (
    <main aria-label="Canopy canvas" data-files={city?.stats.fileCount ?? 0}>
      <UrlBar city={city} isLoading={isLoading} limits={limits} onAnalyze={analyzeRepo} onLoadSample={loadCity} />
      <Toolbar city={city} />
      <SearchBox city={city} />
      {error ? <div className="scene-placeholder">{error}</div> : <City />}
      <ProgressOverlay job={job} rateLimitMessage={rateLimitMessage} />
      <FlyHud />
      <TimeSlider city={city} />
      <InspectPanel city={city} selectedId={selectedId} />
    </main>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
