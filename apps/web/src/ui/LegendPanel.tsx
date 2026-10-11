import { useEffect, useState } from "react";
import { useCityStore } from "../store";
import { legendForViewMode } from "./legend";

export function LegendPanel() {
  const viewMode = useCityStore((state) => state.viewMode);
  const items = legendForViewMode(viewMode);
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const openItem = items.find((item) => item.label === openLabel) ?? null;

  useEffect(() => {
    setOpenLabel(null);
  }, [viewMode]);

  useEffect(() => {
    if (!openLabel) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenLabel(null);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (!(event.target as Element | null)?.closest?.(".legend-panel")) {
        setOpenLabel(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openLabel]);

  return (
    <aside className="legend-panel" aria-label="Current view legend">
      <strong>{legendTitle(viewMode)}</strong>
      <ol>
        {items.map((item) => (
          <li key={`${viewMode}-${item.label}`}>
            <span className="legend-swatch" style={{ background: item.color }} />
            <em>{item.label}</em>
            <button
              aria-expanded={openLabel === item.label}
              aria-label={`What does ${item.label} mean?`}
              className={openLabel === item.label ? "legend-info is-open" : "legend-info"}
              onClick={() => setOpenLabel(openLabel === item.label ? null : item.label)}
              type="button"
            >
              i
            </button>
          </li>
        ))}
      </ol>
      {openItem ? (
        <div className="legend-card" role="note">
          <header>
            <span className="legend-swatch" style={{ background: openItem.color }} />
            <strong>{openItem.label}</strong>
          </header>
          <p>{openItem.info}</p>
        </div>
      ) : null}
    </aside>
  );
}

function legendTitle(viewMode: string): string {
  if (viewMode === "language") return "Language";
  if (viewMode === "churn") return "Churn";
  if (viewMode === "complexity") return "Complexity";
  return "Risk";
}
