import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Color, type Mesh } from "three";
import type { CityData } from "@canopy/shared";
import { theme } from "../theme";
import { useCityStore } from "../store";
import { buildingHeight, fileById, fileCenter } from "./model";

interface RoadsProps {
  city: CityData;
}

type Vec3 = [number, number, number];

const ARC_SEGMENTS = 14;
const MAX_ROUTES = 420;
const MAX_HIGHLIGHTED = 36;
const ROUTE_LOW = new Color("#3f9a8a");
const ROUTE_HIGH = new Color("#f2c04a");

export function Roads({ city }: RoadsProps) {
  const showRoads = useCityStore((state) => state.showRoads);
  const selectedId = useCityStore((state) => state.selectedId);

  const arcs = useMemo(() => {
    const result: Array<{ edgeKey: string; from: number; to: number; points: Vec3[] }> = [];
    for (const edge of city.edges.slice(0, MAX_ROUTES)) {
      const from = fileById(city.files, edge.from);
      const to = fileById(city.files, edge.to);
      if (!from || !to) {
        continue;
      }
      const [fromX, fromZ] = fileCenter(from);
      const [toX, toZ] = fileCenter(to);
      const fromY = buildingHeight(from.loc) + 0.2;
      const toY = buildingHeight(to.loc) + 0.2;
      const lift = Math.max(3, Math.min(14, Math.hypot(fromX - toX, fromZ - toZ) * 0.1));
      result.push({
        edgeKey: `${edge.from}-${edge.to}`,
        from: edge.from,
        to: edge.to,
        points: sampleArc([fromX, fromY, fromZ], [(fromX + toX) / 2, Math.max(fromY, toY) + lift, (fromZ + toZ) / 2], [toX, toY, toZ]),
      });
    }
    return result;
  }, [city]);

  // One merged line geometry for every dependency route keeps this to a single draw call.
  const geometry = useMemo(() => {
    const positions = new Float32Array(arcs.length * ARC_SEGMENTS * 6);
    const colors = new Float32Array(arcs.length * ARC_SEGMENTS * 6);
    const color = new Color();
    arcs.forEach((arc, arcIndex) => {
      for (let step = 0; step < ARC_SEGMENTS; step += 1) {
        const offset = (arcIndex * ARC_SEGMENTS + step) * 6;
        const a = arc.points[step]!;
        const b = arc.points[step + 1]!;
        positions.set(a, offset);
        positions.set(b, offset + 3);
        color.copy(ROUTE_LOW).lerp(ROUTE_HIGH, step / ARC_SEGMENTS);
        colors.set([color.r, color.g, color.b], offset);
        color.copy(ROUTE_LOW).lerp(ROUTE_HIGH, (step + 1) / ARC_SEGMENTS);
        colors.set([color.r, color.g, color.b], offset + 3);
      }
    });
    const result = new BufferGeometry();
    result.setAttribute("position", new BufferAttribute(positions, 3));
    result.setAttribute("color", new BufferAttribute(colors, 3));
    return result;
  }, [arcs]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const highlighted = useMemo(
    () =>
      selectedId === null
        ? []
        : arcs.filter((arc) => arc.from === selectedId || arc.to === selectedId).slice(0, MAX_HIGHLIGHTED),
    [arcs, selectedId],
  );

  if (!showRoads) {
    return null;
  }

  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial depthWrite={false} opacity={selectedId === null ? 0.5 : 0.12} transparent vertexColors />
      </lineSegments>
      {highlighted.map((arc) => (
        <group key={arc.edgeKey}>
          <Line color={theme.gold} lineWidth={2.6} opacity={0.9} points={arc.points} transparent />
          <RoutePulse points={arc.points} seed={arc.from * 7 + arc.to} />
        </group>
      ))}
    </group>
  );
}

function RoutePulse({ points, seed }: { points: Vec3[]; seed: number }) {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) {
      return;
    }
    const t = (state.clock.elapsedTime * 0.35 + (seed % 10) / 10) % 1;
    const position = t * ARC_SEGMENTS;
    const index = Math.min(ARC_SEGMENTS - 1, Math.floor(position));
    const mix = position - index;
    const a = points[index]!;
    const b = points[index + 1]!;
    mesh.position.set(a[0] + (b[0] - a[0]) * mix, a[1] + (b[1] - a[1]) * mix, a[2] + (b[2] - a[2]) * mix);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.32, 10, 8]} />
      <meshBasicMaterial color="#fff3c4" fog={false} />
    </mesh>
  );
}

function sampleArc(from: Vec3, control: Vec3, to: Vec3): Vec3[] {
  const points: Vec3[] = [];
  for (let step = 0; step <= ARC_SEGMENTS; step += 1) {
    const t = step / ARC_SEGMENTS;
    const u = 1 - t;
    points.push([
      u * u * from[0] + 2 * u * t * control[0] + t * t * to[0],
      u * u * from[1] + 2 * u * t * control[1] + t * t * to[1],
      u * u * from[2] + 2 * u * t * control[2] + t * t * to[2],
    ]);
  }
  return points;
}
