import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useIsMobile } from "../hooks/useIsMobile";
import { TYPE_COLOR } from "../utils/constants";
import { hashId, mulberry32 } from "../utils/format";
import type { ConnectionEdge, Receipt } from "../data/types";

const CAMERA = { position: [0, 0.4, 9] as [number, number, number], fov: 50, near: 0.1, far: 40 };
const DPR_M: [number, number] = [1, 1.25];
const DPR_D: [number, number] = [1, 1.7];

export default function MemoryUniverse({
  receipts,
  edges,
}: {
  receipts: Receipt[];
  edges: ConnectionEdge[];
}) {
  const mobile = useIsMobile();
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0"
      onMouseMove={(e) => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      }}
    >
      <Canvas
        camera={CAMERA}
        dpr={mobile ? DPR_M : DPR_D}
        gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.Fog("#07070A", 8, 22);
          scene.background = new THREE.Color("#07070A");
        }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[0, 0, 2]} intensity={1.4} color="#7C6BFF" />
        <pointLight position={[6, 4, 4]} intensity={0.4} color="#5EEAD4" />
        <Core />
        <Fragments receipts={receipts} mobile={mobile} />
        {!mobile && <Threads receipts={receipts} edges={edges} />}
        <Dust count={mobile ? 80 : 220} />
        <CameraRig mouse={mouse} />
      </Canvas>
    </div>
  );
}

function CameraRig({ mouse }: { mouse: MutableRefObject<{ x: number; y: number }> }) {
  useFrame(({ camera }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 1.4, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.4 + mouse.current.y * 0.8, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.12;
    const s = 1 + Math.sin(clock.elapsedTime * 1.4) * 0.04;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.55, 1]} />
      <meshStandardMaterial
        color="#7C6BFF"
        emissive="#7C6BFF"
        emissiveIntensity={1.6}
        roughness={0.2}
        metalness={0.4}
      />
    </mesh>
  );
}

function Fragments({ receipts, mobile }: { receipts: Receipt[]; mobile: boolean }) {
  const mesh = useMemo(() => {
    const sample = receipts.slice(0, mobile ? 48 : 110);
    const geo = new THREE.BoxGeometry(0.12, 0.16, 0.02);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.2 });
    const inst = new THREE.InstancedMesh(geo, mat, sample.length);
    inst.frustumCulled = false;
    const dummy = new THREE.Object3D();
    const c = new THREE.Color();
    const colors = new Float32Array(sample.length * 3);
    sample.forEach((r, i) => {
      const rng = mulberry32(hashId(r.id));
      const radius = 1.8 + rng() * 4.2;
      const phi = rng() * Math.PI * 2;
      const th = rng() * Math.PI;
      dummy.position.set(
        radius * Math.sin(th) * Math.cos(phi),
        (rng() - 0.5) * 3.4,
        radius * Math.sin(th) * Math.sin(phi),
      );
      dummy.rotation.set(rng() * 2, rng() * 2, rng());
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      c.set(TYPE_COLOR[r.type]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });
    inst.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    return inst;
  }, [receipts, mobile]);

  useFrame(({ clock }) => {
    mesh.rotation.y = clock.elapsedTime * 0.03;
  });

  return <primitive object={mesh} />;
}

function Threads({ receipts, edges }: { receipts: Receipt[]; edges: ConnectionEdge[] }) {
  const positions = useMemo(() => {
    const byId = new Map<string, THREE.Vector3>();
    receipts.slice(0, 110).forEach((r) => {
      const rng = mulberry32(hashId(r.id));
      const radius = 1.8 + rng() * 4.2;
      const phi = rng() * Math.PI * 2;
      const th = rng() * Math.PI;
      byId.set(
        r.id,
        new THREE.Vector3(
          radius * Math.sin(th) * Math.cos(phi),
          (rng() - 0.5) * 3.4,
          radius * Math.sin(th) * Math.sin(phi),
        ),
      );
    });
    const pts: number[] = [];
    let n = 0;
    for (const e of edges) {
      const a = byId.get(e.a);
      const b = byId.get(e.b);
      if (!a || !b) continue;
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      n += 1;
      if (n >= 42) break;
    }
    return new Float32Array(pts);
  }, [receipts, edges]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  if (positions.length < 6) return null;
  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color="#7C6BFF" transparent opacity={0.22} />
    </lineSegments>
  );
}

function Dust({ count }: { count: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const rng = mulberry32(11);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rng() - 0.5) * 16;
      arr[i * 3 + 1] = (rng() - 0.5) * 10;
      arr[i * 3 + 2] = (rng() - 0.5) * 16;
    }
    return arr;
  }, [count]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#c4b5fd" transparent opacity={0.45} />
    </points>
  );
}
