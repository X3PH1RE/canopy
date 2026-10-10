import type { CityData } from "@canopy/shared";

interface InspectPanelProps {
  city: CityData | null;
  selectedId: number | null;
}

export function InspectPanel({ city, selectedId }: InspectPanelProps) {
  const file = selectedId === null ? null : city?.files[selectedId] ?? null;

  if (!file) {
    return (
      <aside className="inspect-panel">
        <h2>Select a building</h2>
        <p>Click any tower to inspect its file path and metrics.</p>
      </aside>
    );
  }

  return (
    <aside className="inspect-panel">
      <h2>{file.name}</h2>
      <p>{file.path}</p>
      <dl>
        <div><dt>LOC</dt><dd>{file.loc}</dd></div>
        <div><dt>Functions</dt><dd>{file.functionCount}</dd></div>
        <div><dt>Complexity</dt><dd>{file.complexity}</dd></div>
        <div><dt>Risk</dt><dd>{Math.round(file.risk * 100)}%</dd></div>
      </dl>
    </aside>
  );
}
