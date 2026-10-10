import { useEffect, useState } from "react";
import { useCityStore } from "../store";
import { canopyWorldState } from "../scene/worldState";

export function FlyHud() {
  const isFlyMode = useCityStore((state) => state.isFlyMode);
  const activeBuildingId = useCityStore((state) => state.activeBuildingId);
  const [readout, setReadout] = useState({ speed: 0, altitude: 0 });

  useEffect(() => {
    if (!isFlyMode) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setReadout({
        speed: Math.round(canopyWorldState.drone.speed),
        altitude: Math.round(canopyWorldState.drone.y),
      });
    }, 180);

    return () => window.clearInterval(timer);
  }, [isFlyMode]);

  if (!isFlyMode) {
    return null;
  }

  return (
    <aside className="fly-hud" aria-label="Fly mode">
      <strong>Fly mode</strong>
      <span>WASD move · Q/E altitude · Shift boost · Enter expand · F orbit</span>
      <dl>
        <div><dt>Speed</dt><dd>{readout.speed}</dd></div>
        <div><dt>Altitude</dt><dd>{readout.altitude}</dd></div>
        <div><dt>Nearby</dt><dd>{activeBuildingId ?? "-"}</dd></div>
      </dl>
    </aside>
  );
}
