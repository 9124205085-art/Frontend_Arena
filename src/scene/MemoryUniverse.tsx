import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { TYPE_COLOR } from "../utils/constants";
import { hashId, mulberry32 } from "../utils/format";
import type { ConnectionEdge, Receipt } from "../data/types";

const CAMERA = { position: [0, 0.32, 10.8] as [number, number, number], fov: 40, near: 0.1, far: 48 };
const DPR_M: [number, number] = [1, 1.15];
const DPR_D: [number, number] = [1, 1.55];
const GL_M = { antialias: false, alpha: true, powerPreference: "high-performance" as const, stencil: false };
const GL_D = { antialias: true, alpha: true, powerPreference: "high-performance" as const, stencil: false };
const LIGHT_CORE: [number, number, number] = [0, 0.15, 2.1];
const LIGHT_RIM: [number, number, number] = [5.2, 3.4, 3.6];
const LIGHT_FILL: [number, number, number] = [-4.2, -1.2, 1.8];
const RING_ROT: [number, number, number] = [Math.PI / 2.15, 0.18, 0];
const RING_ROT_2: [number, number, number] = [1.05, 0.4, 0.2];
const TORUS: [number, number, number, number] = [1.42, 0.006, 6, 96];
const TORUS_2: [number, number, number, number] = [2.05, 0.004, 6, 80];
const GROUND_ROT: [number, number, number] = [-Math.PI / 2, 0, 0];
const GROUND_POS: [number, number, number] = [0, -2.55, 0];
const GROUND_ARGS: [number, number] = [4.8, 48];
const LOOK = new THREE.Vector3(0, 0.12, 0);

function takeStride(list: Receipt[], n: number): Receipt[] {
  if (n <= 0 || list.length === 0) return [];
  if (list.length <= n) return list;
  const step = list.length / n;
  const out: Receipt[] = [];
  for (let i = 0; i < n; i++) out.push(list[Math.floor(i * step)]!);
  return out;
}

function visualSample(receipts: Receipt[], n: number): Receipt[] {
  const buckets: Record<Receipt["source"], Receipt[]> = { household: [], spotify: [], india: [] };
  for (const r of receipts) buckets[r.source].push(r);
  const sp = Math.min(buckets.spotify.length, Math.floor(n * 0.5));
  const hh = Math.min(buckets.household.length, Math.floor(n * 0.25));
  const ind = Math.min(buckets.india.length, n - sp - hh);
  return [...takeStride(buckets.spotify, sp), ...takeStride(buckets.household, hh), ...takeStride(buckets.india, ind)];
}

function fragmentOrbit(id: string) {
  const rng = mulberry32(hashId(id));
  const radius = 2.05 + rng() * 4.4;
  const phi = rng() * Math.PI * 2;
  const th = 0.42 + rng() * 2.25;
  return {
    x: radius * Math.sin(th) * Math.cos(phi),
    y: (rng() - 0.5) * 2.55,
    z: radius * Math.sin(th) * Math.sin(phi),
    rx: rng() * 2,
    ry: rng() * 2,
    rz: rng(),
    speed: 0.12 + rng() * 0.28,
  };
}

export default function MemoryUniverse({
  receipts,
  edges,
  mobile,
}: {
  receipts: Receipt[];
  edges: ConnectionEdge[];
  mobile: boolean;
}) {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0"
      onMouseMove={(e) => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={CAMERA}
        dpr={mobile ? DPR_M : DPR_D}
        gl={mobile ? GL_M : GL_D}
        onCreated={({ scene, gl }) => {
          scene.fog = new THREE.Fog("#07070A", 6.5, 19);
          scene.background = new THREE.Color("#07070A");
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
        }}
      >
        <ambientLight intensity={0.16} />
        <hemisphereLight color="#c4b5fd" groundColor="#07070A" intensity={0.42} />
        <pointLight position={LIGHT_CORE} intensity={2.1} color="#8B7CFF" distance={14} decay={2} />
        <pointLight position={LIGHT_RIM} intensity={0.55} color="#5EEAD4" distance={18} decay={2} />
        <pointLight position={LIGHT_FILL} intensity={0.28} color="#60A5FA" distance={16} decay={2} />
        <Core />
        <GroundGlow />
        <Fragments receipts={receipts} mobile={mobile} mouse={mouse} />
        {!mobile && <Threads receipts={receipts} edges={edges} />}
        <Dust count={mobile ? 70 : 180} />
        <CameraRig mouse={mouse} />
      </Canvas>
    </div>
  );
}

function GroundGlow() {
  const geo = useMemo(() => new THREE.CircleGeometry(...GROUND_ARGS), []);
  return (
    <mesh rotation={GROUND_ROT} position={GROUND_POS} geometry={geo}>
      <meshBasicMaterial color="#7C6BFF" transparent opacity={0.07} depthWrite={false} />
    </mesh>
  );
}

function CameraRig({ mouse }: { mouse: MutableRefObject<{ x: number; y: number }> }) {
  useFrame(({ camera }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 1.15, 0.035);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.32 + mouse.current.y * 0.62, 0.035);
    camera.lookAt(LOOK);
  });
  return null;
}

function Core() {
  const inner = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  const meshes = useMemo(() => {
    const core = new THREE.IcosahedronGeometry(0.52, 1);
    const glow = new THREE.SphereGeometry(0.92, 28, 28);
    const ring = new THREE.TorusGeometry(...TORUS);
    const ring2 = new THREE.TorusGeometry(...TORUS_2);
    return { core, glow, ring, ring2 };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (inner.current) {
      inner.current.rotation.y = t * 0.16;
      inner.current.rotation.x = t * 0.04;
      const s = 1 + Math.sin(t * 1.15) * 0.045;
      inner.current.scale.setScalar(s);
    }
    if (halo.current) {
      const s = 1.05 + Math.sin(t * 0.9) * 0.06;
      halo.current.scale.setScalar(s);
    }
    if (ring.current) ring.current.rotation.z = t * 0.12;
  });

  return (
    <group>
      <mesh ref={inner} geometry={meshes.core}>
        <meshStandardMaterial
          color="#9F8CFF"
          emissive="#7C6BFF"
          emissiveIntensity={1.85}
          roughness={0.18}
          metalness={0.62}
        />
      </mesh>
      <mesh ref={halo} geometry={meshes.glow}>
        <meshBasicMaterial color="#7C6BFF" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring} rotation={RING_ROT} geometry={meshes.ring}>
        <meshBasicMaterial color="#C4B5FD" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh rotation={RING_ROT_2} geometry={meshes.ring2}>
        <meshBasicMaterial color="#5EEAD4" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Fragments({
  receipts,
  mobile,
  mouse,
}: {
  receipts: Receipt[];
  mobile: boolean;
  mouse: MutableRefObject<{ x: number; y: number }>;
}) {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pack = useMemo(() => {
    const sample = visualSample(receipts, mobile ? 36 : 92);
    const items = sample.map((r) => ({ id: r.id, type: r.type, ...fragmentOrbit(r.id) }));
    const geo = new THREE.BoxGeometry(0.1, 0.14, 0.016);
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.26,
      metalness: 0.58,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.28,
    });
    const inst = new THREE.InstancedMesh(geo, mat, items.length);
    inst.frustumCulled = false;
    const colors = new Float32Array(items.length * 3);
    const c = new THREE.Color();
    items.forEach((item, i) => {
      c.set(TYPE_COLOR[item.type]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });
    inst.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    return { inst, items };
  }, [receipts, mobile]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const mx = mouse.current.x * 0.28;
    const my = mouse.current.y * 0.2;
    pack.items.forEach((item, i) => {
      const a = t * item.speed * 0.14;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      dummy.position.set(
        item.x * cos - item.z * sin + mx,
        item.y + Math.sin(t * 0.55 + i) * 0.05 + my,
        item.x * sin + item.z * cos,
      );
      dummy.rotation.set(item.rx + t * 0.04, item.ry + t * 0.07, item.rz);
      dummy.updateMatrix();
      pack.inst.setMatrixAt(i, dummy.matrix);
    });
    pack.inst.instanceMatrix.needsUpdate = true;
  });

  return <primitive object={pack.inst} />;
}

function Threads({ receipts, edges }: { receipts: Receipt[]; edges: ConnectionEdge[] }) {
  const line = useMemo(() => {
    const byId = new Map<string, THREE.Vector3>();
    visualSample(receipts, 92).forEach((r) => {
      const p = fragmentOrbit(r.id);
      byId.set(r.id, new THREE.Vector3(p.x, p.y, p.z));
    });
    const pts: number[] = [];
    let n = 0;
    for (const e of edges) {
      const a = byId.get(e.a);
      const b = byId.get(e.b);
      if (!a || !b) continue;
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      n += 1;
      if (n >= 38) break;
    }
    if (pts.length < 6) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    const mat = new THREE.LineBasicMaterial({
      color: "#8B7CFF",
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.LineSegments(geo, mat);
  }, [receipts, edges]);

  if (!line) return null;
  return <primitive object={line} />;
}

function Dust({ count }: { count: number }) {
  const points = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    const rng = mulberry32(11);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rng() - 0.5) * 18;
      arr[i * 3 + 1] = (rng() - 0.5) * 11;
      arr[i * 3 + 2] = (rng() - 0.5) * 18;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.026,
      color: "#ddd6fe",
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  }, [count]);

  useFrame(({ clock }) => {
    points.rotation.y = clock.elapsedTime * 0.01;
  });

  return <primitive object={points} />;
}
