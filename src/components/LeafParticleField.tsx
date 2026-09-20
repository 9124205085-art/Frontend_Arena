import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createLeafGeometry } from "../scene/leafGeometry";
import { mulberry32 } from "../lib/theme";

interface LeafParticleFieldProps {
  count?: number;
}

/**
 * Ambient background leaves — InstancedMesh, not clickable.
 * Built as a THREE object (not declarative args) so R3F never
 * reconciles a new `args` array into an infinite update loop.
 */
export default function LeafParticleField({ count = 220 }: LeafParticleFieldProps) {
  const n = count;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { mesh, sim } = useMemo(() => {
    const rng = mulberry32(2026);
    const simState = Array.from({ length: n }, () => ({
      x: (rng() - 0.5) * 22,
      y: rng() * 18 + 2,
      z: (rng() - 0.5) * 14 - 1,
      speed: 0.25 + rng() * 0.7,
      sway: 0.4 + rng() * 1.1,
      phase: rng() * Math.PI * 2,
      spin: (rng() - 0.5) * 1.4,
      tilt: rng() * Math.PI,
      scale: 0.45 + rng() * 0.9,
    }));

    const geom = createLeafGeometry(0);
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.72,
      metalness: 0.04,
      side: THREE.DoubleSide,
      vertexColors: false,
    });
    const inst = new THREE.InstancedMesh(geom, mat, n);
    inst.frustumCulled = false;

    const palette = new Float32Array(n * 3);
    const c = new THREE.Color();
    const cr = mulberry32(99);
    for (let i = 0; i < n; i++) {
      c.setHSL(0.045 + cr() * 0.08, 0.62 + cr() * 0.25, 0.28 + cr() * 0.28);
      palette[i * 3] = c.r;
      palette[i * 3 + 1] = c.g;
      palette[i * 3 + 2] = c.b;
    }
    inst.instanceColor = new THREE.InstancedBufferAttribute(palette, 3);
    return { mesh: inst, sim: simState };
  }, [n]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const capped = Math.min(dt, 0.05);
    for (let i = 0; i < n; i++) {
      const L = sim[i];
      L.y -= L.speed * capped * 1.15;
      if (L.y < -8) {
        L.y = 12 + (i % 7);
        L.x = Math.random() * 22 - 11;
      }
      const x = L.x + Math.sin(t * 0.55 + L.phase) * L.sway;
      dummy.position.set(x, L.y, L.z);
      dummy.rotation.set(
        L.tilt + t * 0.12 * L.spin,
        t * L.spin,
        Math.sin(t * 0.4 + L.phase) * 0.6,
      );
      dummy.scale.setScalar(L.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <primitive object={mesh} />;
}
