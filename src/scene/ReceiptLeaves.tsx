import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createLeafGeometry } from "./leafGeometry";
import { TYPE_COLOR, hexToRgb } from "../lib/theme";
import { restFor, spawnSeed } from "./layout";
import { neighborIds, useFilteredReceipts, useLifeStore } from "../store";
import type { Receipt } from "../data/types";
import { livePositions } from "./livePositions";

export default function ReceiptLeaves() {
  const receipts = useFilteredReceipts();
  const chapters = useLifeStore((s) => s.chapters);
  const mode = useLifeStore((s) => s.mode);
  const selectedId = useLifeStore((s) => s.selectedId);
  const caughtId = useLifeStore((s) => s.caughtId);
  const edges = useLifeStore((s) => s.edges);
  const catchLeaf = useLifeStore((s) => s.catchLeaf);
  const geom = useMemo(() => createLeafGeometry(0), []);
  const oak = useMemo(() => createLeafGeometry(1), []);
  const elm = useMemo(() => createLeafGeometry(2), []);
  const neighbors = useMemo(
    () => (selectedId ? neighborIds(selectedId, edges) : []),
    [selectedId, edges],
  );

  return (
    <group>
      {receipts.map((r, i) => (
        <ReceiptLeaf
          key={r.id}
          receipt={r}
          index={i}
          total={receipts.length}
          geometry={r.type === "music" ? oak : r.type === "place" ? elm : geom}
          dimmed={
            Boolean(selectedId) &&
            selectedId !== r.id &&
            !neighbors.includes(r.id) &&
            mode === "explore"
          }
          highlighted={neighbors.includes(r.id)}
          selected={selectedId === r.id || caughtId === r.id}
          onCatch={() => catchLeaf(r.id)}
          chapters={chapters}
          mode={mode}
        />
      ))}
    </group>
  );
}

function ReceiptLeaf({
  receipt,
  index,
  total,
  geometry,
  dimmed,
  highlighted,
  selected,
  onCatch,
  chapters,
  mode,
}: {
  receipt: Receipt;
  index: number;
  total: number;
  geometry: THREE.BufferGeometry;
  dimmed: boolean;
  highlighted: boolean;
  selected: boolean;
  onCatch: () => void;
  chapters: ReturnType<typeof useLifeStore.getState>["chapters"];
  mode: ReturnType<typeof useLifeStore.getState>["mode"];
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => spawnSeed(receipt.id), [receipt.id]);
  const fall = useRef({ ...seed });
  const [r, g, b] = hexToRgb(TYPE_COLOR[receipt.type]);
  const color = useMemo(() => new THREE.Color(r, g, b), [r, g, b]);
  const hovered = useRef(false);

  useFrame(({ clock, camera }, dt) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const d = Math.min(dt, 0.05);
    const target = new THREE.Vector3();

    if (mode === "landing") {
      if (selected) {
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        target.copy(camera.position).add(camDir.multiplyScalar(3.2)).add(new THREE.Vector3(0.9, 0.15, 0));
        m.position.lerp(target, 0.08);
        m.rotation.y += d * 3.2;
        m.rotation.x = THREE.MathUtils.lerp(m.rotation.x, 0.15, 0.08);
      } else {
        fall.current.y -= seed.speed * d * 1.2;
        if (fall.current.y < -7) fall.current.y = 12;
        const x = seed.x + Math.sin(t * 0.6 + seed.phase) * 1.2;
        target.set(x, fall.current.y, seed.z);
        m.position.lerp(target, 0.2);
        m.rotation.set(t * 0.3 + seed.phase, t * 0.5, Math.sin(t + seed.phase) * 0.5);
      }
    } else {
      const rest = restFor(receipt, index, total, chapters, mode);
      target.set(rest[0], rest[1], rest[2]);
      if (selected && mode === "story") target.y += 0.55;
      m.position.lerp(target, 0.06);
      const spin = selected ? t * 0.8 : t * 0.15 + seed.phase;
      m.rotation.y = THREE.MathUtils.lerp(m.rotation.y, spin, 0.08);
      m.rotation.z = Math.sin(t * 0.4 + seed.phase) * 0.25;
    }

    const want = selected ? 1.35 : highlighted ? 1.18 : hovered.current ? 1.12 : 1;
    const s = THREE.MathUtils.lerp(m.scale.x, want, 0.12);
    m.scale.setScalar(s);

    const mat = m.material as THREE.MeshStandardMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, dimmed ? 0.12 : 0.96, 0.08);
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      selected ? 0.85 : highlighted ? 0.45 : 0.12,
      0.1,
    );

    let stored = livePositions.get(receipt.id);
    if (!stored) {
      stored = m.position.clone();
      livePositions.set(receipt.id, stored);
    } else {
      stored.copy(m.position);
    }
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      onClick={(e) => {
        e.stopPropagation();
        onCatch();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        hovered.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hovered.current = false;
        document.body.style.cursor = "auto";
      }}
    >
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.12}
        roughness={0.55}
        metalness={0.08}
        side={THREE.DoubleSide}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}
