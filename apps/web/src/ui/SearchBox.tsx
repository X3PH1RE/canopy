import { useMemo, useState } from "react";
import type { CityData } from "@canopy/shared";
import { searchCity } from "../search";
import { useCityStore } from "../store";

interface SearchBoxProps {
  city: CityData | null;
}

export function SearchBox({ city }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const setSelectedId = useCityStore((state) => state.setSelectedId);
  const isFlyMode = useCityStore((state) => state.isFlyMode);
  const requestFocus = useCityStore((state) => state.requestFocus);
  const results = useMemo(() => (city ? searchCity(city, query) : []), [city, query]);

  if (!city) {
    return null;
  }

  return (
    <section className="search-box" aria-label="Search files and functions">
      <input
        aria-label="Search files and functions"
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Search files or functions"
        value={query}
      />
      {query.trim() ? (
        <ol>
          {results.length > 0 ? (
            results.map((result) => (
              <li key={`${result.kind}-${result.fileId}-${result.label}-${result.detail}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (!isFlyMode) {
                      setSelectedId(result.fileId);
                    }
                    requestFocus(result.fileId);
                    setQuery("");
                  }}
                >
                  <span>{result.label}</span>
                  <small>{result.detail}</small>
                </button>
              </li>
            ))
          ) : (
            <li className="search-empty">No matches</li>
          )}
        </ol>
      ) : null}
    </section>
  );
}
