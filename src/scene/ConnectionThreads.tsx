import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useFilteredReceipts, useLifeStore, neighborIds } from "../store";
import { livePositions } from "./livePositions";

export default function ConnectionThreads() {
  const mode = useLifeStore((s) => s.mode);
  const edges = useLifeStore((s) => s.edges);
  const selectedId = useLifeStore((s) => s.selectedId);
  const visible = useFilteredReceipts();
  const ids = useMemo(() => new Set(visible.map((r) => r.id)), [visible]);
  const line = useRef<THREE.LineSegments>(null);

  const { positions } = useMemo(() => {
    const list = edges.filter((e) => ids.has(e.a) && ids.has(e.b));
    return { positions: new Float32Array(Math.max(1, list.length) * 6) };
  }, [edges, ids]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame(() => {
    if (mode !== "explore") return;
    const attr = geom.getAttribute("position") as THREE.BufferAttribute;
    const list = edges.filter((e) => ids.has(e.a) && ids.has(e.b));
    const neigh = selectedId ? new Set(neighborIds(selectedId, edges)) : null;
    let w = 0;
    for (const e of list) {
      if (selectedId && e.a !== selectedId && e.b !== selectedId && !neigh?.has(e.a) && !neigh?.has(e.b)) {
        continue;
      }
      if (selectedId && e.a !== selectedId && e.b !== selectedId) continue;
      const pa = livePositions.get(e.a);
      const pb = livePositions.get(e.b);
      if (!pa || !pb) continue;
      attr.setXYZ(w, pa.x, pa.y, pa.z);
      attr.setXYZ(w + 1, pb.x, pb.y, pb.z);
      w += 2;
    }
    geom.setDrawRange(0, w);
    attr.needsUpdate = true;
  });

  if (mode !== "explore") return null;

  return (
    <lineSegments ref={line} geometry={geom} frustumCulled={false}>
      <lineBasicMaterial
        color="#fbbf24"
        transparent
        opacity={selectedId ? 0.75 : 0.28}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}
