import { Line } from "@react-three/drei";
import type { CityData } from "@canopy/shared";
import { theme } from "../theme";
import { useCityStore } from "../store";
import { buildingHeight, edgeMatchesSelection, fileById, fileCenter } from "./model";

interface RoadsProps {
  city: CityData;
}

export function Roads({ city }: RoadsProps) {
  const showRoads = useCityStore((state) => state.showRoads);
  const selectedId = useCityStore((state) => state.selectedId);

  if (!showRoads) {
    return null;
  }

  const roadEdges = selectedId === null
    ? city.edges.slice(0, 320)
    : city.edges.filter((edge) => edgeMatchesSelection(edge, selectedId)).concat(
      city.edges.filter((edge) => !edgeMatchesSelection(edge, selectedId)).slice(0, 180),
    );

  return (
    <group>
      {roadEdges.slice(0, 420).map((edge, index) => {
        const from = fileById(city.files, edge.from);
        const to = fileById(city.files, edge.to);

        if (!from || !to) {
          return null;
        }

        const [fromX, fromZ] = fileCenter(from);
        const [toX, toZ] = fileCenter(to);
        const isHighlighted = edgeMatchesSelection(edge, selectedId);
        const fromY = buildingHeight(from.loc) + 0.14;
        const toY = buildingHeight(to.loc) + 0.14;
        const lift = Math.max(3, Math.min(12, Math.hypot(fromX - toX, fromZ - toZ) * 0.08));

        return (
          <Line
            key={`${edge.from}-${edge.to}-${index}`}
            points={[
              [fromX, fromY, fromZ],
              [(fromX + toX) / 2, Math.max(fromY, toY) + lift, (fromZ + toZ) / 2],
              [toX, toY, toZ],
            ]}
            color={isHighlighted ? theme.sun : theme.ink}
            transparent
            opacity={isHighlighted ? 0.78 : selectedId === null ? 0.26 : 0.08}
            lineWidth={isHighlighted ? 2.2 : 1}
          />
        );
      })}
    </group>
  );
}
