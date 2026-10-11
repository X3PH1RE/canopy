import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, Object3D, type InstancedMesh, type Mesh } from "three";
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
const ROUTE_LOW = new Color("#19c7a6");
const ROUTE_HIGH = new Color("#ffd23f");
const MAX_FLOW_PULSES = 90;

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

  // Every route is one fat-line segment list, so the whole network stays a single draw call.
  const { segmentPoints, segmentColors } = useMemo(() => {
    const points: Vec3[] = [];
    const colors: Array<[number, number, number]> = [];
    const color = new Color();
    for (const arc of arcs) {
      for (let step = 0; step < ARC_SEGMENTS; step += 1) {
        points.push(arc.points[step]!, arc.points[step + 1]!);
        color.copy(ROUTE_LOW).lerp(ROUTE_HIGH, step / ARC_SEGMENTS);
        colors.push([color.r, color.g, color.b]);
        color.copy(ROUTE_LOW).lerp(ROUTE_HIGH, (step + 1) / ARC_SEGMENTS);
        colors.push([color.r, color.g, color.b]);
      }
    }
    return { segmentPoints: points, segmentColors: colors };
  }, [arcs]);

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
      {segmentPoints.length > 0 ? (
        <Line
          depthWrite={false}
          lineWidth={selectedId === null ? 2.4 : 1.2}
          opacity={selectedId === null ? 0.9 : 0.22}
          points={segmentPoints}
          segments
          transparent
          vertexColors={segmentColors}
        />
      ) : null}
      {selectedId === null ? <FlowPulses arcs={arcs} /> : null}
      {highlighted.map((arc) => (
        <group key={arc.edgeKey}>
          <Line color={theme.gold} lineWidth={4.2} opacity={1} points={arc.points} transparent />
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

// Light packets travelling along a sample of routes make the dependency network read as live traffic.
function FlowPulses({ arcs }: { arcs: Array<{ points: Vec3[]; from: number; to: number }> }) {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const sample = useMemo(() => {
    const stride = Math.max(1, Math.floor(arcs.length / MAX_FLOW_PULSES));
    return arcs.filter((_, index) => index % stride === 0).slice(0, MAX_FLOW_PULSES);
  }, [arcs]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) {
      return;
    }
    sample.forEach((arc, index) => {
      const t = (state.clock.elapsedTime * 0.3 + ((arc.from * 31 + arc.to * 17) % 100) / 100) % 1;
      const position = t * ARC_SEGMENTS;
      const step = Math.min(ARC_SEGMENTS - 1, Math.floor(position));
      const mix = position - step;
      const a = arc.points[step]!;
      const b = arc.points[step + 1]!;
      dummy.position.set(a[0] + (b[0] - a[0]) * mix, a[1] + (b[1] - a[1]) * mix, a[2] + (b[2] - a[2]) * mix);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.count = sample.length;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX_FLOW_PULSES]} frustumCulled={false}>
      <sphereGeometry args={[0.38, 8, 6]} />
      <meshBasicMaterial color="#fff6c9" fog={false} />
    </instancedMesh>
  );
}
