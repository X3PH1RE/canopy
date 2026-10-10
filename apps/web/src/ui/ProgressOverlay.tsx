import type { JobResponse } from "../api";
import { loadingCopyForStage } from "./loading";

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

  return (
    <section className="progress-overlay" role="status">
      <strong>{job.status === "error" ? "Analysis stopped" : copy.title}</strong>
      <p>{job.status === "error" ? job.error ?? "Something went wrong." : copy.detail}</p>
      <div className="progress-track">
        <span style={{ width: `${Math.round(job.progress * 100)}%` }} />
      </div>
    </section>
  );
}
