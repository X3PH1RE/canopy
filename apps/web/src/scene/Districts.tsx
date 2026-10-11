import { Html } from "@react-three/drei";
import type { CityData } from "@canopy/shared";
import { theme } from "../theme";

interface DistrictsProps {
  city: CityData;
  worldSize: number;
}

export function Districts({ city, worldSize }: DistrictsProps) {
  return (
    <group>
      <Island worldSize={worldSize} />
      {city.districts.map((district) => (
        <group key={`${district.path}-${district.depth}`}>
          <mesh
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
          {district.depth === 1 ? (
            <Html position={[district.x, 0.12, district.z]} center distanceFactor={22} occlude>
              <span className="district-label">{districtLabel(district.path)}</span>
            </Html>
          ) : null}
        </group>
      ))}
    </group>
  );
}

function districtLabel(path: string): string {
  const label = path.split("/").filter(Boolean).at(-1) ?? path;
  return label || "root";
}

function Island({ worldSize }: { worldSize: number }) {
  const radius = worldSize * 0.76 + 14;
  return (
    <group>
      <mesh position={[0, -2.05, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.97, 4, 96]} />
        <meshStandardMaterial attach="material-0" color="#8a6a45" roughness={0.95} />
        <meshStandardMaterial attach="material-1" color={theme.ground} roughness={0.9} />
        <meshStandardMaterial attach="material-2" color="#6e5236" roughness={0.95} />
      </mesh>
      <mesh position={[0, -4 - radius * 0.28, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[radius * 0.97, radius * 0.56, 48]} />
        <meshStandardMaterial color="#6e5236" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}
