import type { CityData } from "@canopy/shared";
import { theme } from "../theme";

interface DistrictsProps {
  city: CityData;
  worldSize: number;
}

export function Districts({ city, worldSize }: DistrictsProps) {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[worldSize + 18, worldSize + 18]} />
        <meshStandardMaterial color={theme.ground} roughness={0.86} />
      </mesh>
      {city.districts.map((district) => (
        <mesh
          key={`${district.path}-${district.depth}`}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[district.x, 0.01 + district.depth * 0.012, district.z]}
        >
          <planeGeometry args={[Math.max(0.2, district.w - 0.32), Math.max(0.2, district.d - 0.32)]} />
          <meshStandardMaterial
            color={district.depth === 1 ? "#6fab76" : "#88bd84"}
            transparent
            opacity={district.depth === 1 ? 0.58 : 0.36}
            roughness={0.92}
          />
        </mesh>
      ))}
    </group>
  );
}
