import type { CityData } from "@canopy/shared";
import { useCityStore } from "../store";
import type { ViewMode } from "../scene/model";

interface ToolbarProps {
  city: CityData | null;
}

const VIEW_MODES: Array<{ value: ViewMode; label: string }> = [
  { value: "language", label: "Language" },
  { value: "churn", label: "Churn" },
  { value: "complexity", label: "Complexity" },
  { value: "risk", label: "Risk" },
];

export function Toolbar({ city }: ToolbarProps) {
  const viewMode = useCityStore((state) => state.viewMode);
  const setViewMode = useCityStore((state) => state.setViewMode);

  if (!city) {
    return null;
  }

  return (
    <section className="stats-banner" aria-label="Repository controls">
      <div className="stats-line" aria-label="Repository stats">
        <span>{city.stats.fileCount} files</span>
        <span>{city.stats.totalLoc.toLocaleString()} LOC</span>
        <span>{city.stats.commitCount} commits</span>
        <span>{city.stats.authorCount} authors</span>
      </div>
      <div className="segmented-control" aria-label="View mode">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            className={viewMode === mode.value ? "is-active" : undefined}
            aria-pressed={viewMode === mode.value}
            onClick={() => setViewMode(mode.value)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </section>
  );
}
