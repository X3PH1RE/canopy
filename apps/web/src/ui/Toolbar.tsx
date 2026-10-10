import type { CityData } from "@canopy/shared";

interface ToolbarProps {
  city: CityData | null;
}

export function Toolbar({ city }: ToolbarProps) {
  if (!city) {
    return null;
  }

  return (
    <section className="stats-banner" aria-label="Repository stats">
      <span>{city.stats.fileCount} files</span>
      <span>{city.stats.totalLoc.toLocaleString()} LOC</span>
      <span>{city.stats.commitCount} commits</span>
      <span>{city.stats.authorCount} authors</span>
    </section>
  );
}
