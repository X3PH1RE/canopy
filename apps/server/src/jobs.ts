import type { CityData } from "@canopy/shared";

export type JobStatus = "queued" | "running" | "done" | "error";

export interface JobState {
  id: string;
  status: JobStatus;
  stage: string;
  progress: number;
  error?: string;
  city?: CityData;
}

export type AnalyzeRepository = (repoUrl: string) => Promise<CityData>;

export interface JobQueue {
  start: (repoUrl: string) => JobState;
  addDone: (city: CityData) => JobState;
  get: (id: string) => JobState | undefined;
}

export function createJobQueue(analyzer: AnalyzeRepository): JobQueue {
  const jobs = new Map<string, JobState>();
  let nextId = 1;

  function createJob(): JobState {
    const job: JobState = {
      id: `job-${nextId}`,
      status: "queued",
      stage: "queued",
      progress: 0,
    };
    nextId += 1;
    jobs.set(job.id, job);
    return job;
  }

  return {
    start(repoUrl) {
      const job = createJob();
      void runJob(job, repoUrl, analyzer);
      return job;
    },
    addDone(city) {
      const job = createJob();
      job.status = "done";
      job.stage = "done";
      job.progress = 1;
      job.city = city;
      return job;
    },
    get(id) {
      return jobs.get(id);
    },
  };
}

async function runJob(job: JobState, repoUrl: string, analyzer: AnalyzeRepository): Promise<void> {
  try {
    job.status = "running";
    job.stage = "cloning";
    job.progress = 0.05;
    job.city = await analyzer(repoUrl);
    job.status = "done";
    job.stage = "done";
    job.progress = 1;
  } catch (error) {
    job.status = "error";
    job.stage = "error";
    job.progress = 1;
    job.error = error instanceof Error ? error.message : "Analysis failed";
  }
}
