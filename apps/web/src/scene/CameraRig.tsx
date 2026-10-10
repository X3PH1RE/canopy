import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CityData } from "@canopy/shared";
import { useCityStore } from "../store";
import { cameraFocusForFile, fileById } from "./model";

interface CameraRigProps {
  city: CityData;
  worldSize: number;
}

interface FocusAnimation {
  elapsed: number;
  fromCamera: Vector3;
  fromTarget: Vector3;
  toCamera: Vector3;
  toTarget: Vector3;
}

export function CameraRig({ city, worldSize }: CameraRigProps) {
  const camera = useThree((state) => state.camera);
  const focusRequest = useCityStore((state) => state.focusRequest);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const animationRef = useRef<FocusAnimation | null>(null);

  useEffect(() => {
    if (!focusRequest || !controlsRef.current) {
      return;
    }

    const file = fileById(city.files, focusRequest.fileId);
    if (!file) {
      return;
    }

    const focus = cameraFocusForFile(file, worldSize);
    animationRef.current = {
      elapsed: 0,
      fromCamera: camera.position.clone(),
      fromTarget: controlsRef.current.target.clone(),
      toCamera: new Vector3(...focus.camera),
      toTarget: new Vector3(...focus.target),
    };
  }, [camera, city.files, focusRequest, worldSize]);

  useFrame((_, delta) => {
    const animation = animationRef.current;
    const controls = controlsRef.current;
    if (!animation || !controls) {
      return;
    }

    animation.elapsed += Math.min(delta, 0.05);
    const t = Math.min(1, animation.elapsed / 1);
    const eased = t * t * (3 - 2 * t);
    camera.position.lerpVectors(animation.fromCamera, animation.toCamera, eased);
    controls.target.lerpVectors(animation.fromTarget, animation.toTarget, eased);
    controls.update();

    if (t >= 1) {
      animationRef.current = null;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[82, 72, 94]} fov={42} />
      <OrbitControls
        ref={controlsRef}
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
