import type { CityData } from "@code-city/shared";

const emptyStats: CityData["stats"] = {
  fileCount: 0,
  totalLoc: 0,
  commitCount: 0,
  authorCount: 0,
  languages: {},
};

export function App() {
  return <main aria-label="Code City canvas" data-files={emptyStats.fileCount} />;
}
