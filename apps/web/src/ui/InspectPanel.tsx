import type { CityData } from "@canopy/shared";
import { buildDependencyIndex, dependenciesForFile } from "../graph";
import { fileById } from "../scene/model";
import { useCityStore } from "../store";

interface InspectPanelProps {
  city: CityData | null;
  selectedId: number | null;
}

export function InspectPanel({ city, selectedId }: InspectPanelProps) {
  const requestFocus = useCityStore((state) => state.requestFocus);
  const file = selectedId === null || !city ? null : fileById(city.files, selectedId) ?? null;
  const dependencies = file && city ? dependenciesForFile(city, file.id, buildDependencyIndex(city)) : null;

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
      <button className="focus-button" type="button" onClick={() => requestFocus(file.id)}>
        Focus
      </button>
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
      {dependencies ? <DependencyLists imports={dependencies.imports} importedBy={dependencies.importedBy} /> : null}
    </aside>
  );
}

interface DependencyListsProps {
  imports: Array<{ id: number; path: string; name: string }>;
  importedBy: Array<{ id: number; path: string; name: string }>;
}

function DependencyLists({ imports, importedBy }: DependencyListsProps) {
  if (imports.length === 0 && importedBy.length === 0) {
    return (
      <section className="dependency-list" aria-label="Dependencies">
        <h3>Dependencies</h3>
        <p>No relative dependency routes for this file yet.</p>
      </section>
    );
  }

  return (
    <section className="dependency-list" aria-label="Dependencies">
      <DependencyGroup title="Imports" files={imports} />
      <DependencyGroup title="Imported by" files={importedBy} />
    </section>
  );
}

function DependencyGroup({ title, files }: { title: string; files: DependencyListsProps["imports"] }) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div>
      <h3>{title}</h3>
      <ol>
        {files.slice(0, 8).map((dependency) => (
          <li key={dependency.id} title={dependency.path}>
            <span>{dependency.name}</span>
            <small>{dependency.path}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
