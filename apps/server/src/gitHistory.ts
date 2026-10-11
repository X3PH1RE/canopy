import type { Timeline } from "@canopy/shared";
import { runGit } from "./clone";

export interface GitChange {
  path: string;
  added: number;
  deleted: number;
}

export interface GitCommit {
  sha: string;
  author: string;
  timestamp: number;
  changes: GitChange[];
}

export interface ParsedGitHistoryLog {
  commits: GitCommit[];
}

export interface HistoryFileInput {
  id: number;
  path: string;
  loc: number;
}

export interface FileHistorySummary {
  churn: number;
  authorCount: number;
  commitCount: number;
  lastModified: string | null;
  commitTimestamps: number[];
}

export interface GitHistorySummary {
  commitCount: number;
  authorCount: number;
  files: Map<string, FileHistorySummary>;
  timeline: Timeline | null;
  truncated: boolean;
}

interface WorkingFileHistory {
  authors: Set<string>;
  commitTimestamps: number[];
  lastModified: number | null;
  runningLoc: number;
  locChanges: Array<{ timestamp: number; loc: number }>;
}

const HISTORY_LIMIT = 5000;
const CHURN_WINDOW_SECONDS = 90 * 24 * 60 * 60;
const TIMELINE_FRAMES = 100;

export function parseGitHistoryLog(output: string): ParsedGitHistoryLog {
  const commits: GitCommit[] = [];
  let current: GitCommit | null = null;

  for (const line of output.split(/\r?\n/)) {
    if (!line) {
      continue;
    }

    if (line.startsWith("@@")) {
      const [sha, author, rawTimestamp] = line.slice(2).split("|");
      const timestamp = Number(rawTimestamp);
      if (!sha || !author || !Number.isFinite(timestamp)) {
        current = null;
        continue;
      }

      current = { sha, author, timestamp, changes: [] };
      commits.push(current);
      continue;
    }

    if (!current) {
      continue;
    }

    const [rawAdded, rawDeleted, ...pathParts] = line.split("\t");
    const added = Number(rawAdded);
    const deleted = Number(rawDeleted);
    const filePath = pathParts.join("\t");
    if (!filePath || !Number.isFinite(added) || !Number.isFinite(deleted)) {
      continue;
    }

    current.changes.push({
      path: normalizePath(filePath),
      added,
      deleted,
    });
  }

  return { commits };
}

export async function analyzeGitHistory(
  repoDir: string,
  files: HistoryFileInput[],
): Promise<GitHistorySummary | null> {
  try {
    const output = await runGit(
      [
        "-C",
        repoDir,
        "log",
        `--max-count=${HISTORY_LIMIT}`,
        "--reverse",
        "--no-renames",
        "--numstat",
        "--format=@@%H|%an|%at",
      ],
      10_000,
    );
    return buildHistorySummary(parseGitHistoryLog(output), files);
  } catch {
    return null;
  }
}

export function buildHistorySummary(log: ParsedGitHistoryLog, files: HistoryFileInput[]): GitHistorySummary {
  const histories = new Map<string, WorkingFileHistory>();
  const currentPaths = new Set(files.map((file) => normalizePath(file.path)));
  const authors = new Set<string>();

  for (const commit of log.commits) {
    authors.add(commit.author);
    for (const change of commit.changes) {
      if (!currentPaths.has(change.path)) {
        continue;
      }

      const history = getWorkingHistory(histories, change.path);
      history.authors.add(commit.author);
      history.commitTimestamps.push(commit.timestamp);
      history.lastModified = commit.timestamp;
      history.runningLoc = Math.max(0, history.runningLoc + change.added - change.deleted);
      history.locChanges.push({ timestamp: commit.timestamp, loc: history.runningLoc });
    }
  }

  const headTimestamp = log.commits.length > 0 ? log.commits[log.commits.length - 1]!.timestamp : null;
  const churnWindowStart = churnStart(log.commits, headTimestamp);
  const filesByPath = new Map<string, HistoryFileInput>(files.map((file) => [normalizePath(file.path), file]));
  const summaries = new Map<string, FileHistorySummary>();

  for (const file of files) {
    const filePath = normalizePath(file.path);
    const history = histories.get(filePath);
    const timestamps = history?.commitTimestamps ?? [];
    summaries.set(filePath, {
      churn: churnWindowStart === null ? 0 : timestamps.filter((timestamp) => timestamp >= churnWindowStart).length,
      authorCount: history?.authors.size ?? 0,
      commitCount: timestamps.length,
      lastModified: history?.lastModified === null || history?.lastModified === undefined
        ? null
        : new Date(history.lastModified * 1000).toISOString(),
      commitTimestamps: timestamps,
    });
  }

  return {
    commitCount: log.commits.length,
    authorCount: authors.size,
    files: summaries,
    timeline: buildTimeline(log.commits, files, histories, filesByPath),
    truncated: log.commits.length >= HISTORY_LIMIT,
  };
}

function getWorkingHistory(histories: Map<string, WorkingFileHistory>, filePath: string): WorkingFileHistory {
  const existing = histories.get(filePath);
  if (existing) {
    return existing;
  }

  const created: WorkingFileHistory = {
    authors: new Set<string>(),
    commitTimestamps: [],
    lastModified: null,
    runningLoc: 0,
    locChanges: [],
  };
  histories.set(filePath, created);
  return created;
}

function churnStart(commits: GitCommit[], headTimestamp: number | null): number | null {
  if (headTimestamp === null) {
    return null;
  }

  const windowStart = headTimestamp - CHURN_WINDOW_SECONDS;
  if (commits.some((commit) => commit.timestamp >= windowStart)) {
    return windowStart;
  }

  const fallbackIndex = Math.max(0, commits.length - 100);
  return commits[fallbackIndex]?.timestamp ?? windowStart;
}

function buildTimeline(
  commits: GitCommit[],
  files: HistoryFileInput[],
  histories: Map<string, WorkingFileHistory>,
  filesByPath: Map<string, HistoryFileInput>,
): Timeline | null {
  if (commits.length < 2) {
    return null;
  }

  // Author dates are not monotonic after rebases or cherry-picks, so bound the timeline by min/max, not log order.
  const timestamps = commits.map((commit) => commit.timestamp);
  const first = Math.min(...timestamps);
  const last = Math.max(...timestamps);
  const span = last - first;
  if (span <= 0) {
    return null;
  }

  return {
    frameCount: TIMELINE_FRAMES,
    frameDates: Array.from({ length: TIMELINE_FRAMES }, (_, frame) =>
      new Date((first + (span * frame) / (TIMELINE_FRAMES - 1)) * 1000).toISOString(),
    ),
    locSeries: files.map((file) => locSeriesForFile(file, histories.get(normalizePath(file.path)), first, span)),
    changeFrames: files.map((file) => changeFramesForFile(histories.get(normalizePath(file.path)), first, span)),
  };
}

function locSeriesForFile(
  file: HistoryFileInput,
  history: WorkingFileHistory | undefined,
  first: number,
  span: number,
): Array<[number, number]> {
  if (!history || history.locChanges.length === 0) {
    return [];
  }

  const finalRawLoc = history.locChanges[history.locChanges.length - 1]?.loc ?? 0;
  const scale = finalRawLoc > 0 ? file.loc / finalRawLoc : 1;
  const byFrame = new Map<number, number>();

  for (const change of history.locChanges) {
    byFrame.set(frameForTimestamp(change.timestamp, first, span), Math.max(0, Math.round(change.loc * scale)));
  }

  return Array.from(byFrame.entries()).sort((a, b) => a[0] - b[0]);
}

function changeFramesForFile(
  history: WorkingFileHistory | undefined,
  first: number,
  span: number,
): number[] {
  if (!history) {
    return [];
  }

  return Array.from(
    new Set(history.commitTimestamps.map((timestamp) => frameForTimestamp(timestamp, first, span))),
  ).sort((a, b) => a - b);
}

function frameForTimestamp(timestamp: number, first: number, span: number): number {
  return Math.max(0, Math.min(TIMELINE_FRAMES - 1, Math.floor(((timestamp - first) / span) * (TIMELINE_FRAMES - 1))));
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/");
}
