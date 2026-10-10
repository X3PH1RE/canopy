export interface CityData {
  version: 1;
  repo: {
    url: string;
    name: string;
    headSha: string;
    analyzedAt: string;
    truncated: boolean;
  };
  stats: {
    fileCount: number;
    totalLoc: number;
    commitCount: number;
    authorCount: number;
    languages: Record<string, number>;
  };
  files: FileNode[];
  districts: District[];
  edges: Edge[];
  timeline: Timeline | null;
}

export interface FileNode {
  id: number;
  path: string;
  name: string;
  language: string;
  loc: number;
  functionCount: number;
  complexity: number;
  maxFunctionComplexity: number;
  churn: number;
  authorCount: number;
  lastModified: string;
  risk: number;
  x: number;
  z: number;
  w: number;
  d: number;
  functions?: FunctionInfo[];
}

export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  complexity: number;
}

export interface District {
  path: string;
  depth: number;
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface Edge {
  from: number;
  to: number;
  weight: number;
}

export interface Timeline {
  frameCount: number;
  frameDates: string[];
  locSeries: Array<Array<[number, number]>>;
  changeFrames: number[][];
}
