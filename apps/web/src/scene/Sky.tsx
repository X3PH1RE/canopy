import { useMemo } from "react";
import { BackSide, ShaderMaterial } from "three";

export function Sky() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 horizon = vec3(1.0, 0.89, 0.70);
            vec3 mid = vec3(0.75, 0.90, 0.84);
            vec3 top = vec3(0.44, 0.74, 0.80);
            vec3 col = mix(horizon, mid, smoothstep(0.0, 0.28, h));
            col = mix(col, top, smoothstep(0.25, 0.9, h));
            float sun = pow(max(dot(vDir, normalize(vec3(0.42, 0.52, 0.34))), 0.0), 220.0);
            col += vec3(1.0, 0.86, 0.6) * sun * 0.9;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );

  return (
    <mesh material={material} renderOrder={-10}>
      <sphereGeometry args={[520, 32, 16]} />
    </mesh>
  );
}
