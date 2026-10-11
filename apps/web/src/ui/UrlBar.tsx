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
      <div className="brand">
        <svg aria-hidden="true" className="brand-mark" viewBox="0 0 32 32">
          <path d="M16 3c6 4 9 9 9 14a9 9 0 0 1-18 0c0-5 3-10 9-14z" fill="#5fa05a" />
          <path d="M16 9v19M16 17l5-4M16 21l-5-4" fill="none" stroke="#fff8e0" strokeLinecap="round" strokeWidth="1.6" />
        </svg>
        <div>
        <strong>Canopy</strong>
        <span>{city ? city.repo.name : "Static sample"}{limitText(limits)}</span>
        </div>
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
        <button className="primary" type="submit" disabled={isLoading}>
          {isLoading ? "Growing..." : "Analyze"}
        </button>
        <button className="secondary" type="button" onClick={onLoadSample} disabled={isLoading}>
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
