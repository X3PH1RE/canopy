import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import { theme } from "../theme";
import { canopyWorldState } from "./worldState";

interface DroneProps {
  visible: boolean;
}

export function Drone({ visible }: DroneProps) {
  const groupRef = useRef<Group>(null);
  const rotorRefs = useRef<Mesh[]>([]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const drone = canopyWorldState.drone;
    group.visible = visible;
    group.position.set(drone.x, drone.y + Math.sin(state.clock.elapsedTime * 2.4) * 0.08, drone.z);
    group.rotation.set(0, drone.yaw, Math.min(0.26, drone.speed * 0.018));

    for (const rotor of rotorRefs.current) {
      rotor.rotation.y += delta * 36;
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      <mesh castShadow>
        <sphereGeometry args={[0.7, 18, 12]} />
        <meshStandardMaterial color={theme.ink} roughness={0.36} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[1.35, 0.22, 0.62]} />
        <meshStandardMaterial color={theme.glass} emissive={theme.glass} emissiveIntensity={0.18} roughness={0.2} />
      </mesh>
      {[
        [-1.15, 0, -1.15],
        [1.15, 0, -1.15],
        [-1.15, 0, 1.15],
        [1.15, 0, 1.15],
      ].map(([x, y, z], index) => (
        <group key={`${x}:${z}`} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.8, 8]} />
            <meshStandardMaterial color={theme.timber} roughness={0.5} />
          </mesh>
          <mesh
            ref={(mesh) => {
              if (mesh) rotorRefs.current[index] = mesh;
            }}
            rotation={[0, 0, Math.PI / 2]}
          >
            <boxGeometry args={[1.1, 0.045, 0.14]} />
            <meshStandardMaterial color={theme.gold} transparent opacity={0.72} roughness={0.22} />
          </mesh>
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.65, 0]}>
        <circleGeometry args={[1.4, 24]} />
        <meshBasicMaterial color="#12302a" transparent opacity={0.18} />
      </mesh>
      <pointLight color={theme.gold} intensity={0.7} distance={10} />
    </group>
  );
}
