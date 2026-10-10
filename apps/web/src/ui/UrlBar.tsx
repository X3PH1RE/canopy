import type { CityData } from "@canopy/shared";

interface UrlBarProps {
  city: CityData | null;
  isLoading: boolean;
  onLoadSample: () => void;
}

export function UrlBar({ city, isLoading, onLoadSample }: UrlBarProps) {
  return (
    <header className="top-bar">
      <div>
        <strong>Canopy</strong>
        <span>{city ? city.repo.name : "Static sample"}</span>
      </div>
      <button type="button" onClick={onLoadSample} disabled={isLoading}>
        {isLoading ? "Growing..." : "Load sample"}
      </button>
    </header>
  );
}
