import { useState } from "react";
import type { CityData } from "@canopy/shared";
import type { LimitState } from "../api";

interface UrlBarProps {
  city: CityData | null;
  isLoading: boolean;
  limits: LimitState | null;
  onAnalyze: (repoUrl: string) => void;
  onLoadSample: () => void;
}

export function UrlBar({ city, isLoading, limits, onAnalyze, onLoadSample }: UrlBarProps) {
  const [repoUrl, setRepoUrl] = useState("https://github.com/expressjs/express");

  return (
    <header className="top-bar">
      <div>
        <strong>Canopy</strong>
        <span>{city ? city.repo.name : "Static sample"}{limitText(limits)}</span>
      </div>
      <form
        className="repo-form"
        onSubmit={(event) => {
          event.preventDefault();
          onAnalyze(repoUrl);
        }}
      >
        <input
          aria-label="GitHub repository URL"
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          placeholder="https://github.com/owner/repo"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Growing..." : "Analyze"}
        </button>
        <button type="button" onClick={onLoadSample} disabled={isLoading}>
          Sample
        </button>
      </form>
    </header>
  );
}

function limitText(limits: LimitState | null): string {
  if (!limits?.enabled) {
    return "";
  }

  return ` · ${limits.remaining} of ${limits.max} builds left`;
}
