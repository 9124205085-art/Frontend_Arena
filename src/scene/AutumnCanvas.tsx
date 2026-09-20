import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import LeafParticleField from "../components/LeafParticleField";
import { useIsMobile } from "../hooks/useIsMobile";
import { useLifeStore } from "../store";
import ConnectionThreads from "./ConnectionThreads";
import { chapterCenter } from "./layout";
import ReceiptLeaves from "./ReceiptLeaves";

const CAMERA = { position: [0, 1.8, 11] as [number, number, number], fov: 48, near: 0.1, far: 80 };
const DPR_MOBILE: [number, number] = [1, 1.3];
const DPR_DESKTOP: [number, number] = [1, 1.8];
const GL_MOBILE = { antialias: false, powerPreference: "high-performance" as const, alpha: false };
const GL_DESKTOP = { antialias: true, powerPreference: "high-performance" as const, alpha: false };
const SUN: [number, number, number] = [6, 8, 4];
const FILL: [number, number, number] = [-8, 2, -6];
const LAMP: [number, number, number] = [0, 3, 2];
const RAY_POS: [number, number, number] = [4, 6, -6];
const RAY_ROT: [number, number, number] = [0, 0, -0.45];
const PLANE: [number, number] = [18, 22];
const DISK: [number, number] = [2.4, 24];
const GROUND_ROT: [number, number, number] = [-Math.PI / 2, 0, 0];

function Lights() {
  return (
    <>
      <hemisphereLight color="#ffb36b" groundColor="#2a1208" intensity={0.85} />
      <directionalLight position={SUN} intensity={1.35} color="#ffd7a1" />
      <directionalLight position={FILL} intensity={0.25} color="#7c2d12" />
      <pointLight position={LAMP} intensity={0.4} color="#f59e0b" distance={18} />
    </>
  );
}

function GodRays() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.045 + Math.sin(clock.elapsedTime * 0.3) * 0.015;
    ref.current.rotation.z = -0.4 + Math.sin(clock.elapsedTime * 0.07) * 0.05;
  });
  return (
    <mesh ref={ref} position={RAY_POS} rotation={RAY_ROT}>
      <planeGeometry args={PLANE} />
      <meshBasicMaterial color="#f59e0b" transparent opacity={0.05} depthWrite={false} />
    </mesh>
  );
}

function CameraRig() {
  const mode = useLifeStore((s) => s.mode);
  const chapters = useLifeStore((s) => s.chapters);
  const activeChapterId = useLifeStore((s) => s.activeChapterId);
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const dest = useRef(new THREE.Vector3());
  const destLook = useRef(new THREE.Vector3());

  useFrame(() => {
    if (mode === "explore") return;
    if (mode === "landing") {
      dest.current.set(0, 1.8, 11);
      destLook.current.set(0, 0.6, 0);
    } else {
      const idx = Math.max(0, chapters.findIndex((c) => c.id === activeChapterId));
      const [x, y, z] = chapterCenter(idx < 0 ? 0 : idx);
      dest.current.set(x + 0.4, y + 3.4, z + 9.2);
      destLook.current.set(x, y + 0.6, z);
    }
    camera.position.lerp(dest.current, 0.045);
    look.current.lerp(destLook.current, 0.06);
    camera.lookAt(look.current);
  });
  return null;
}

function GroveGrounds() {
  const mode = useLifeStore((s) => s.mode);
  const chapters = useLifeStore((s) => s.chapters);
  if (mode !== "story") return null;
  return (
    <group>
      {chapters.map((c, i) => {
        const [x, y, z] = chapterCenter(i);
        return (
          <mesh key={c.id} position={[x, y - 0.35, z]} rotation={GROUND_ROT}>
            <circleGeometry args={DISK} />
            <meshStandardMaterial color="#2a140c" roughness={1} transparent opacity={0.55} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function AutumnCanvas() {
  const mode = useLifeStore((s) => s.mode);
  const mobile = useIsMobile();
  const explore = mode === "explore" && !mobile;

  return (
    <Canvas
      dpr={mobile ? DPR_MOBILE : DPR_DESKTOP}
      camera={CAMERA}
      gl={mobile ? GL_MOBILE : GL_DESKTOP}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color("#140a07");
        scene.fog = new THREE.Fog("#1a0d08", 10, 32);
        console.log("Autumn canvas ready");
      }}
    >
      <Lights />
      {!mobile && <GodRays />}
      <LeafParticleField count={mobile ? 70 : 260} />
      <GroveGrounds />
      <ReceiptLeaves />
      <ConnectionThreads />
      <CameraRig />
      {explore && (
        <OrbitControls enablePan={false} minDistance={4} maxDistance={22} autoRotate autoRotateSpeed={0.35} />
      )}
    </Canvas>
  );
}
