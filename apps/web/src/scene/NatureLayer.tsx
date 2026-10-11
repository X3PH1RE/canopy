import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, Object3D, type Group, type InstancedMesh } from "three";
import type { CityData } from "@canopy/shared";
import { theme } from "../theme";
import { groundcoverForCity, pondsForCity, treePlacementsForCity, type TreePlacement } from "./nature";

interface NatureLayerProps {
  city: CityData;
  worldSize: number;
}

interface InstanceSpec {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  color: Color;
}

const FLOWER_COLORS = ["#f48fb1", "#ffd36b", "#fff4e0", "#c7a6ff", "#ff9e7a"].map((hex) => new Color(hex));

export function NatureLayer({ city, worldSize }: NatureLayerProps) {
  const ponds = useMemo(() => pondsForCity(city, worldSize), [city, worldSize]);
  const trees = useMemo(
    () =>
      treePlacementsForCity(city, worldSize).filter(
        (tree) => !ponds.some((pond) => Math.hypot(pond.x - tree.x, pond.z - tree.z) < pond.radius + 1.5),
      ),
    [city, worldSize, ponds],
  );
  const round = useMemo(() => trees.filter((_, index) => index % 3 !== 0), [trees]);
  const pines = useMemo(() => trees.filter((_, index) => index % 3 === 0), [trees]);
  const bushes = useMemo(
    () => groundcoverForCity(city, worldSize, Math.min(120, Math.max(30, city.files.length)), "bush", ponds),
    [city, worldSize, ponds],
  );
  const flowers = useMemo(
    () => groundcoverForCity(city, worldSize, Math.min(160, Math.max(40, city.files.length * 1.4)), "flower", ponds),
    [city, worldSize, ponds],
  );

  const roundTrunks = useInstances(round.map((tree) => treeTrunk(tree)));
  const roundCrowns = useInstances(round.flatMap((tree) => treeCrowns(tree)));
  const pineTrunks = useInstances(pines.map((tree) => treeTrunk(tree)));
  const pineCones = useInstances(pines.flatMap((tree) => pineLayers(tree)));
  const bushInstances = useInstances(bushes.map((bush) => bushSpec(bush)));
  const flowerInstances = useInstances(flowers.map((flower, index) => flowerSpec(flower, index)));

  return (
    <group>
      <instancedMesh ref={roundTrunks} args={[undefined, undefined, round.length]} castShadow>
        <cylinderGeometry args={[0.7, 1, 1, 6]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={roundCrowns} args={[undefined, undefined, round.length * 2]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.82} flatShading />
      </instancedMesh>
      <instancedMesh ref={pineTrunks} args={[undefined, undefined, pines.length]} castShadow>
        <cylinderGeometry args={[0.7, 1, 1, 6]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={pineCones} args={[undefined, undefined, pines.length * 2]} castShadow receiveShadow>
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial roughness={0.8} flatShading />
      </instancedMesh>
      <instancedMesh ref={bushInstances} args={[undefined, undefined, bushes.length]} receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.85} flatShading />
      </instancedMesh>
      <instancedMesh ref={flowerInstances} args={[undefined, undefined, flowers.length]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.6} emissive="#ffffff" emissiveIntensity={0.08} />
      </instancedMesh>
      {ponds.map((pond, index) => (
        <group key={index} position={[pond.x, 0.03, pond.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[pond.radius + 0.55, 28]} />
            <meshStandardMaterial color="#c9b98a" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[pond.radius, 28]} />
            <meshStandardMaterial color="#5fb7b0" emissive="#2f8f9a" emissiveIntensity={0.18} metalness={0.3} roughness={0.12} />
          </mesh>
        </group>
      ))}
      <Monorail worldSize={worldSize} />
      <Clouds worldSize={worldSize} />
      <Sparkles
        color="#fff3c4"
        count={Math.min(110, Math.max(50, Math.round(worldSize * 0.7)))}
        opacity={0.8}
        scale={[worldSize * 1.2, 22, worldSize * 1.2]}
        size={5}
        speed={0.25}
      />
    </group>
  );
}

function useInstances(specs: InstanceSpec[]) {
  const ref = useRef<InstancedMesh>(null);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) {
      return;
    }

    const object = new Object3D();
    specs.forEach((spec, index) => {
      object.position.set(spec.x, spec.y, spec.z);
      object.scale.set(spec.sx, spec.sy, spec.sz);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
      mesh.setColorAt(index, spec.color);
    });
    mesh.count = specs.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [specs]);

  return ref;
}

const TRUNK = new Color(theme.timber).multiplyScalar(0.8);
const LEAF_A = new Color("#4f8f64");
const LEAF_B = new Color("#9bcb78");
const PINE_A = new Color("#2f7a58");
const PINE_B = new Color("#4f9a6a");

function treeTrunk(tree: TreePlacement): InstanceSpec {
  return {
    x: tree.x,
    y: 0.8 * tree.scale,
    z: tree.z,
    sx: 0.17 * tree.scale,
    sy: 1.6 * tree.scale,
    sz: 0.17 * tree.scale,
    color: TRUNK,
  };
}

function treeCrowns(tree: TreePlacement): InstanceSpec[] {
  const base = LEAF_A.clone().lerp(LEAF_B, tree.hue);
  return [
    { x: tree.x, y: 1.9 * tree.scale, z: tree.z, sx: 1.05 * tree.scale, sy: 0.9 * tree.scale, sz: 1.05 * tree.scale, color: base },
    {
      x: tree.x + 0.35 * tree.scale,
      y: 2.45 * tree.scale,
      z: tree.z - 0.2 * tree.scale,
      sx: 0.7 * tree.scale,
      sy: 0.62 * tree.scale,
      sz: 0.7 * tree.scale,
      color: base.clone().lerp(LEAF_B, 0.4),
    },
  ];
}

function pineLayers(tree: TreePlacement): InstanceSpec[] {
  const base = PINE_A.clone().lerp(PINE_B, tree.hue);
  return [
    { x: tree.x, y: 1.5 * tree.scale, z: tree.z, sx: 0.95 * tree.scale, sy: 1.5 * tree.scale, sz: 0.95 * tree.scale, color: base },
    { x: tree.x, y: 2.5 * tree.scale, z: tree.z, sx: 0.65 * tree.scale, sy: 1.2 * tree.scale, sz: 0.65 * tree.scale, color: base.clone().lerp(PINE_B, 0.35) },
  ];
}

function bushSpec(bush: TreePlacement): InstanceSpec {
  return {
    x: bush.x,
    y: 0.28 * bush.scale,
    z: bush.z,
    sx: 0.55 * bush.scale,
    sy: 0.4 * bush.scale,
    sz: 0.55 * bush.scale,
    color: LEAF_A.clone().lerp(LEAF_B, bush.hue),
  };
}

function flowerSpec(flower: TreePlacement, index: number): InstanceSpec {
  return {
    x: flower.x,
    y: 0.12,
    z: flower.z,
    sx: 0.13 * flower.scale,
    sy: 0.1 * flower.scale,
    sz: 0.13 * flower.scale,
    color: FLOWER_COLORS[index % FLOWER_COLORS.length]!,
  };
}

function Monorail({ worldSize }: { worldSize: number }) {
  const radius = worldSize * 0.76 + 4;
  const podRefs = useRef<Group[]>([]);
  const pylonCount = Math.max(12, Math.round((radius * Math.PI * 2) / 14));
  const pylons = useInstances(
    Array.from({ length: pylonCount }, (_, index) => {
      const angle = (index / pylonCount) * Math.PI * 2;
      return {
        x: Math.cos(angle) * radius,
        y: 1.1,
        z: Math.sin(angle) * radius,
        sx: 0.28,
        sy: 2.2,
        sz: 0.28,
        color: new Color("#e9e1cf"),
      };
    }),
  );

  useFrame((state) => {
    podRefs.current.forEach((pod, index) => {
      const angle = state.clock.elapsedTime * 0.12 + (index / 3) * Math.PI * 2;
      pod.position.set(Math.cos(angle) * radius, 2.55, Math.sin(angle) * radius);
      pod.rotation.y = -angle;
    });
  });

  return (
    <group>
      <mesh position={[0, 2.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.16, 6, 140]} />
        <meshStandardMaterial color="#f2a900" emissive="#f2a900" emissiveIntensity={0.25} roughness={0.5} />
      </mesh>
      <instancedMesh ref={pylons} args={[undefined, undefined, pylonCount]} castShadow>
        <cylinderGeometry args={[0.7, 1, 1, 6]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      {[0, 1, 2].map((index) => (
        <group key={index} ref={(node) => { if (node) podRefs.current[index] = node; }}>
          <mesh castShadow scale={[1.9, 0.62, 0.8]}>
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial color="#f7f1e1" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, 0]} scale={[1.55, 0.2, 0.84]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#8fd3c8" emissive="#8fd3c8" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const CLOUD_PUFFS = Array.from({ length: 9 }, (_, index) => {
  const angle = (index / 9) * Math.PI * 2 + 0.4;
  const dist = 0.55 + ((index * 37) % 10) / 22;
  return { angle, dist, height: 58 + ((index * 13) % 7) * 3, size: 6 + ((index * 17) % 5) * 1.6 };
});

function Clouds({ worldSize }: { worldSize: number }) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.006;
    }
  });

  return (
    <group ref={group}>
      {CLOUD_PUFFS.map((cloud, index) => {
        const span = worldSize * 0.8 * cloud.dist + 30;
        return (
          <group key={index} position={[Math.cos(cloud.angle) * span, cloud.height, Math.sin(cloud.angle) * span]}>
            {[-1, 0, 1].map((puff) => (
              <mesh key={puff} position={[puff * cloud.size * 0.7, Math.abs(puff) === 0 ? 0.8 : 0, 0]} scale={[cloud.size, cloud.size * 0.5, cloud.size * 0.8]}>
                <icosahedronGeometry args={[1, 1]} />
                <meshBasicMaterial color="#fffaf0" fog={false} opacity={0.88} transparent />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
