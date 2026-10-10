import { useCityStore } from "../store";
import { legendForViewMode } from "./legend";

export function LegendPanel() {
  const viewMode = useCityStore((state) => state.viewMode);
  const items = legendForViewMode(viewMode);

  return (
    <aside className="legend-panel" aria-label="Current view legend">
      <strong>{legendTitle(viewMode)}</strong>
      <ol>
        {items.map((item) => (
          <li key={`${viewMode}-${item.label}`}>
            <span style={{ background: item.color }} />
            {item.label}
          </li>
        ))}
      </ol>
    </aside>
  );
}

function legendTitle(viewMode: string): string {
  if (viewMode === "language") return "Language";
  if (viewMode === "churn") return "Churn";
  if (viewMode === "complexity") return "Complexity";
  return "Risk";
}
