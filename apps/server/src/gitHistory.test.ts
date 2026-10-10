import { describe, expect, it } from "vitest";
import { buildHistorySummary, parseGitHistoryLog } from "./gitHistory";

describe("parseGitHistoryLog", () => {
  it("parses commits and skips binary numstat entries", () => {
    const parsed = parseGitHistoryLog(historyLog());

    expect(parsed.commits).toHaveLength(3);
    expect(parsed.commits[0]).toMatchObject({
      sha: "aaa111",
      author: "Ada",
      timestamp: 1_700_000_000,
      changes: [{ path: "src/a.ts", added: 10, deleted: 0 }],
    });
    expect(parsed.commits[1]?.changes.map((change) => change.path)).toEqual(["src/a.ts", "src/b.py"]);
  });
});

describe("buildHistorySummary", () => {
  it("computes file history, head-relative churn, and sampled timeline", () => {
    const summary = buildHistorySummary(parseGitHistoryLog(historyLog()), [
      { id: 0, path: "src/a.ts", loc: 32 },
      { id: 1, path: "src/b.py", loc: 6 },
      { id: 2, path: "docs/read me.md", loc: 3 },
      { id: 3, path: "src/missing.ts", loc: 4 },
    ]);

    expect(summary.commitCount).toBe(3);
    expect(summary.authorCount).toBe(2);
    expect(summary.files.get("src/a.ts")).toMatchObject({
      churn: 1,
      authorCount: 2,
      commitCount: 3,
      lastModified: "2024-03-08T12:26:40.000Z",
    });
    expect(summary.files.get("src/b.py")).toMatchObject({
      churn: 0,
      authorCount: 1,
      commitCount: 1,
    });
    expect(summary.files.get("src/missing.ts")).toMatchObject({
      churn: 0,
      authorCount: 0,
      commitCount: 0,
    });
    expect(summary.timeline?.frameCount).toBe(100);
    expect(summary.timeline?.locSeries).toHaveLength(4);
    expect(summary.timeline?.locSeries[0]?.at(-1)).toEqual([99, 32]);
    expect(summary.timeline?.changeFrames[0]).toContain(99);
  });

  it("returns no timeline for one-commit histories while keeping metrics", () => {
    const summary = buildHistorySummary(
      parseGitHistoryLog("@@aaa111|Ada|1700000000\n7\t0\tsrc/a.ts\n"),
      [{ id: 0, path: "src/a.ts", loc: 7 }],
    );

    expect(summary.commitCount).toBe(1);
    expect(summary.files.get("src/a.ts")).toMatchObject({ churn: 1, authorCount: 1 });
    expect(summary.timeline).toBeNull();
  });
});

function historyLog() {
  return [
    "@@aaa111|Ada|1700000000",
    "10\t0\tsrc/a.ts",
    "-\t-\tassets/logo.png",
    "@@bbb222|Ben|1700100000",
    "5\t1\tsrc/a.ts",
    "3\t0\tsrc/b.py",
    "@@ccc333|Ada|1709900800",
    "2\t0\tsrc/a.ts",
    "1\t0\tdocs/read me.md",
    "",
  ].join("\n");
}
