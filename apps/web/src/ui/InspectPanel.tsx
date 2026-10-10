import type { CityData } from "@canopy/shared";
import { fileById } from "../scene/model";

interface InspectPanelProps {
  city: CityData | null;
  selectedId: number | null;
}

export function InspectPanel({ city, selectedId }: InspectPanelProps) {
  const file = selectedId === null || !city ? null : fileById(city.files, selectedId) ?? null;

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
        <div><dt>Churn</dt><dd>{file.churn}</dd></div>
        <div><dt>Authors</dt><dd>{file.authorCount}</dd></div>
        <div><dt>Risk</dt><dd>{Math.round(file.risk * 100)}%</dd></div>
      </dl>
      <p className="inspect-date">Last touched {formatDate(file.lastModified)}</p>
      {file.functions && file.functions.length > 0 ? (
        <section className="function-list" aria-label="Most complex functions">
          <h3>Complex functions</h3>
          <ol>
            {[...file.functions]
              .sort((a, b) => b.complexity - a.complexity || a.startLine - b.startLine)
              .slice(0, 5)
              .map((fn) => (
                <li key={`${fn.name}-${fn.startLine}`}>
                  <span>{fn.name}</span>
                  <small>c{fn.complexity} / L{fn.startLine}</small>
                </li>
              ))}
          </ol>
        </section>
      ) : null}
    </aside>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
