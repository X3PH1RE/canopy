import { useEffect, useState } from "react";
import { loadSampleCity } from "./api";
import { useCityStore } from "./store";
import { InspectPanel } from "./ui/InspectPanel";
import { Toolbar } from "./ui/Toolbar";
import { UrlBar } from "./ui/UrlBar";

export function App() {
  const city = useCityStore((state) => state.city);
  const error = useCityStore((state) => state.error);
  const selectedId = useCityStore((state) => state.selectedId);
  const setCity = useCityStore((state) => state.setCity);
  const setError = useCityStore((state) => state.setError);
  const [isLoading, setIsLoading] = useState(false);

  async function loadCity() {
    setIsLoading(true);
    try {
      setCity(await loadSampleCity());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load sample city");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCity();
  }, []);

  return (
    <main aria-label="Canopy canvas" data-files={city?.stats.fileCount ?? 0}>
      <UrlBar city={city} isLoading={isLoading} onLoadSample={loadCity} />
      <Toolbar city={city} />
      <div className="scene-placeholder">
        {error ? <p>{error}</p> : <p>{city ? "City data loaded" : "Loading sample city"}</p>}
      </div>
      <InspectPanel city={city} selectedId={selectedId} />
    </main>
  );
}
