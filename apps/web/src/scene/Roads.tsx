import { Line } from "@react-three/drei";
import type { CityData } from "@canopy/shared";
import { theme } from "../theme";
import { fileById, fileCenter } from "./model";

interface RoadsProps {
  city: CityData;
}

export function Roads({ city }: RoadsProps) {
  const roadEdges = city.edges.slice(0, 140);

  return (
    <group>
      {roadEdges.map((edge, index) => {
        const from = fileById(city.files, edge.from);
        const to = fileById(city.files, edge.to);

        if (!from || !to) {
          return null;
        }

        const [fromX, fromZ] = fileCenter(from);
        const [toX, toZ] = fileCenter(to);

        return (
          <Line
            key={`${edge.from}-${edge.to}-${index}`}
            points={[
              [fromX, 0.08, fromZ],
              [toX, 0.08, toZ],
            ]}
            color={theme.ink}
            transparent
            opacity={0.16 + Math.min(edge.weight, 3) * 0.05}
            lineWidth={1}
          />
        );
      })}
    </group>
  );
}
