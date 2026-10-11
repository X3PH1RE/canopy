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
  const showRoads = useCityStore((state) => state.showRoads);
  const isFlyMode = useCityStore((state) => state.isFlyMode);
  const setViewMode = useCityStore((state) => state.setViewMode);
  const setShowRoads = useCityStore((state) => state.setShowRoads);
  const setFlyMode = useCityStore((state) => state.setFlyMode);

  if (!city) {
    return null;
  }

  return (
    <section className="stats-banner" aria-label="Repository controls">
      <dl className="stats-line" aria-label="Repository stats">
        <Stat label={city.stats.fileCount === 1 ? "file" : "files"} value={city.stats.fileCount.toLocaleString()} />
        <Stat label="LOC" value={compact(city.stats.totalLoc)} title={city.stats.totalLoc.toLocaleString()} />
        <Stat label={city.stats.commitCount === 1 ? "commit" : "commits"} value={city.stats.commitCount.toLocaleString()} />
        <Stat label={city.stats.authorCount === 1 ? "author" : "authors"} value={city.stats.authorCount.toLocaleString()} />
      </dl>
      <div className="control-group">
        <span className="control-label">Color by</span>
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
      </div>
      <div className="toggle-row">
        <button
          type="button"
          className={showRoads ? "toggle-button is-active" : "toggle-button"}
          aria-pressed={showRoads}
          onClick={() => setShowRoads(!showRoads)}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M3 15C6 4 14 4 17 15" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><circle cx="3" cy="15" r="2" fill="currentColor" /><circle cx="17" cy="15" r="2" fill="currentColor" /></svg>
          Routes
          <kbd>R</kbd>
        </button>
        <button
          type="button"
          className={isFlyMode ? "toggle-button is-active" : "toggle-button"}
          aria-pressed={isFlyMode}
          onClick={() => setFlyMode(!isFlyMode)}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 3l6 14-6-3-6 3z" fill="currentColor" /></svg>
          Fly
          <kbd>F</kbd>
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="stat" title={title}>
      <dd>{value}</dd>
      <dt>{label}</dt>
    </div>
  );
}

function compact(value: number): string {
  return value >= 10_000 ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value) : value.toLocaleString();
}
