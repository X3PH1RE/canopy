import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

export function CameraRig() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[82, 72, 94]} fov={42} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        maxDistance={170}
        maxPolarAngle={Math.PI / 2.18}
        minDistance={26}
        target={[0, 0, 0]}
      />
    </>
  );
}
