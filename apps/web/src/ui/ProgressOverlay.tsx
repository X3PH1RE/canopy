import type { JobResponse } from "../api";
import { loadingCopyForStage } from "./loading";

const ROUTE_STAGES = ["queued", "cloning", "walking", "parsing", "layout"] as const;
const ROUTE_LABELS = ["Seed", "Fetch", "Paths", "Rings", "Canopy"];

interface ProgressOverlayProps {
  job: JobResponse | null;
  rateLimitMessage: string | null;
}

export function ProgressOverlay({ job, rateLimitMessage }: ProgressOverlayProps) {
  if (rateLimitMessage) {
    return (
      <section className="progress-overlay rate-limit-panel" role="status">
        <strong>Build limit reached</strong>
        <p>{rateLimitMessage}</p>
      </section>
    );
  }

  if (!job || job.status === "done") {
    return null;
  }

  const copy = loadingCopyForStage(job.stage);
  const activeIndex = Math.max(0, ROUTE_STAGES.indexOf(job.stage as (typeof ROUTE_STAGES)[number]));

  return (
    <section className="progress-overlay" role="status">
      <strong>{job.status === "error" ? "Analysis stopped" : copy.title}</strong>
      <p>{job.status === "error" ? job.error ?? "Something went wrong." : copy.detail}</p>
      <ol className="route-steps" aria-hidden="true">
        {ROUTE_STAGES.map((stage, index) => (
          <li className={stepState(index, activeIndex, job.status === "error")} key={stage}>
            <span />
            {ROUTE_LABELS[index]}
          </li>
        ))}
      </ol>
      <div className="progress-track">
        <span style={{ width: `${Math.round(job.progress * 100)}%` }} />
      </div>
    </section>
  );
}

function stepState(index: number, activeIndex: number, failed: boolean): string {
  if (index < activeIndex) {
    return "done";
  }
  if (index === activeIndex) {
    return failed ? "failed" : "active";
  }
  return "";
}
