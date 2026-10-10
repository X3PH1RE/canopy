import { Html } from "@react-three/drei";
import type { CityData, FileNode } from "@canopy/shared";
import { useCityStore } from "../store";
import { fileById } from "./model";
import { canopyWorldState } from "./worldState";

interface DronePopupProps {
  city: CityData;
}

export function DronePopup({ city }: DronePopupProps) {
  const activeBuildingId = useCityStore((state) => state.activeBuildingId);
  const file = activeBuildingId === null ? null : fileById(city.files, activeBuildingId) ?? null;

  if (!file) {
    return null;
  }

  const height = canopyWorldState.liveHeights.get(file.id) ?? 4;

  return (
    <Html position={[file.x, height + 1.6, file.z]} center distanceFactor={14} occlude>
      <article className="drone-popup">
        <strong>{file.name}</strong>
        <span>{file.path}</span>
        <small>{popupStats(file)}</small>
      </article>
    </Html>
  );
}

function popupStats(file: FileNode): string {
  return `${file.loc.toLocaleString()} LOC / risk ${Math.round(file.risk * 100)}%`;
}
