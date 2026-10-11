import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { theme } from "../theme";
import { canopyWorldState } from "./worldState";

interface DroneProps {
  visible: boolean;
}

// Quadcopter in an X layout: motor positions, spin direction and nav-light colour per arm.
const ARMS = [
  { x: -1, z: -1, spin: 1, light: "#ff5a4d" },
  { x: 1, z: -1, spin: -1, light: "#ff5a4d" },
  { x: -1, z: 1, spin: -1, light: "#5dff9a" },
  { x: 1, z: 1, spin: 1, light: "#5dff9a" },
] as const;

const ARM_REACH = 1.05;

export function Drone({ visible }: DroneProps) {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const rotorRefs = useRef<Group[]>([]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const drone = canopyWorldState.drone;
    group.visible = visible;
    if (!visible) {
      return;
    }

    group.position.set(drone.x, drone.y + Math.sin(state.clock.elapsedTime * 2.4) * 0.06, drone.z);
    group.rotation.set(0, drone.yaw, 0);
    if (bodyRef.current) {
      // Pitch forward and bank into motion like a real quad.
      bodyRef.current.rotation.set(Math.min(0.3, drone.speed * 0.02), 0, Math.min(0.12, drone.speed * 0.008));
    }

    ARMS.forEach((arm, index) => {
      const rotor = rotorRefs.current[index];
      if (rotor) {
        rotor.rotation.y += delta * 48 * arm.spin;
      }
    });
  });

  return (
    <group ref={groupRef} visible={visible} scale={0.9}>
      <group ref={bodyRef}>
        {/* Fuselage */}
        <mesh castShadow scale={[1, 0.42, 1.5]}>
          <sphereGeometry args={[0.52, 24, 16]} />
          <meshStandardMaterial color="#f4efe2" roughness={0.32} metalness={0.12} />
        </mesh>
        <mesh castShadow position={[0, -0.02, 0]} scale={[1.08, 0.12, 1.6]}>
          <sphereGeometry args={[0.52, 24, 12]} />
          <meshStandardMaterial color={theme.ink} roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Solar canopy plate */}
        <mesh position={[0, 0.2, -0.05]} rotation={[-0.05, 0, 0]}>
          <boxGeometry args={[0.62, 0.025, 0.78]} />
          <meshStandardMaterial color="#1f4a63" emissive="#8fd3c8" emissiveIntensity={0.18} metalness={0.4} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.215, -0.05]}>
          <boxGeometry args={[0.02, 0.01, 0.78]} />
          <meshStandardMaterial color="#e9e1cf" />
        </mesh>
        {/* Antenna */}
        <mesh position={[0.2, 0.3, 0.45]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.36, 5]} />
          <meshStandardMaterial color={theme.ink} />
        </mesh>
        {/* Camera gimbal */}
        <mesh position={[0, -0.2, 0.58]} castShadow>
          <sphereGeometry args={[0.2, 16, 12]} />
          <meshStandardMaterial color={theme.ink} roughness={0.35} metalness={0.4} />
        </mesh>
        <mesh position={[0, -0.2, 0.77]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.1, 14]} />
          <meshStandardMaterial color="#0b1f1b" metalness={0.6} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.2, 0.83]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.075, 14]} />
          <meshStandardMaterial color="#7fd3ff" emissive="#4aa8ff" emissiveIntensity={0.9} metalness={0.8} roughness={0.05} />
        </mesh>
        {/* Landing skids */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.36, -0.42, 0]}>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 1.3, 6]} />
              <meshStandardMaterial color={theme.ink} />
            </mesh>
            {[-0.42, 0.42].map((z) => (
              <mesh key={z} position={[-side * 0.04, 0.18, z]} rotation={[0, 0, side * 0.2]}>
                <cylinderGeometry args={[0.02, 0.02, 0.38, 5]} />
                <meshStandardMaterial color={theme.ink} />
              </mesh>
            ))}
          </group>
        ))}
        {/* Arms, motors, props, nav lights */}
        {ARMS.map((arm, index) => {
          const angle = Math.atan2(arm.x, arm.z);
          return (
            <group key={`${arm.x}:${arm.z}`}>
              <mesh
                castShadow
                position={[arm.x * ARM_REACH * 0.5, 0.02, arm.z * ARM_REACH * 0.5]}
                rotation={[0, angle, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.055, 0.075, ARM_REACH * 1.45, 8]} />
                <meshStandardMaterial color="#e6e0d0" roughness={0.4} metalness={0.2} />
              </mesh>
              <group position={[arm.x * ARM_REACH, 0.06, arm.z * ARM_REACH]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.13, 0.15, 0.17, 14]} />
                  <meshStandardMaterial color={theme.ink} roughness={0.35} metalness={0.5} />
                </mesh>
                <mesh position={[0, 0.1, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.06, 8]} />
                  <meshStandardMaterial color={theme.gold} metalness={0.7} roughness={0.3} />
                </mesh>
                <group
                  position={[0, 0.14, 0]}
                  ref={(node) => {
                    if (node) rotorRefs.current[index] = node;
                  }}
                >
                  {[0, Math.PI / 2].map((rotation) => (
                    <mesh key={rotation} rotation={[0, rotation, 0]} scale={[1, 1, 1]}>
                      <boxGeometry args={[1.0, 0.012, 0.09]} />
                      <meshStandardMaterial color="#2a3d38" roughness={0.4} />
                    </mesh>
                  ))}
                </group>
                {/* Translucent spin disc sells the rotor blur */}
                <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.52, 24]} />
                  <meshBasicMaterial color="#cfeee6" transparent opacity={0.16} depthWrite={false} />
                </mesh>
                <mesh position={[0, -0.1, 0]}>
                  <sphereGeometry args={[0.045, 8, 6]} />
                  <meshBasicMaterial color={arm.light} fog={false} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
        <circleGeometry args={[1.5, 24]} />
        <meshBasicMaterial color="#12302a" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <pointLight color={theme.gold} intensity={0.6} distance={10} position={[0, -0.4, 0]} />
    </group>
  );
}
