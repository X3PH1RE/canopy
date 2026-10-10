import type { JobResponse } from "../api";

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

  return (
    <section className="progress-overlay" role="status">
      <strong>{job.status === "error" ? "Analysis stopped" : "Growing your city"}</strong>
      <p>{job.status === "error" ? job.error ?? "Something went wrong." : job.stage}</p>
      <div className="progress-track">
        <span style={{ width: `${Math.round(job.progress * 100)}%` }} />
      </div>
    </section>
  );
}
