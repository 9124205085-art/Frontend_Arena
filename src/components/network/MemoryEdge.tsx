import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import { useLifeStore } from "../../store";

/**
 * Edge visuals (highlight / dim) read interaction state from the store.
 * Parent graph geometry can stay referentially stable when a node is clicked.
 */
function MemoryEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const selectedId = useLifeStore((s) => s.selectedId);
  const selectedEdge = useLifeStore((s) => s.selectedEdge);
  const selectedPlace = useLifeStore((s) => s.selectedPlace);
  const a = String((data as { a?: string } | undefined)?.a ?? "");
  const b = String((data as { b?: string } | undefined)?.b ?? "");
  const kind = (data as { kind?: string } | undefined)?.kind;

  const hot =
    kind === "place"
      ? Boolean(selectedPlace && (selectedPlace === a || selectedPlace === b))
      : selectedId === a ||
        selectedId === b ||
        Boolean(selectedEdge && selectedEdge.a === a && selectedEdge.b === b);

  const dimmed =
    kind === "place" ? Boolean(selectedPlace && !hot) : Boolean(selectedId && !hot);

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: kind === "place" ? "#22D3EE" : hot ? "#A99BFF" : "#4a4a5c",
        strokeWidth: hot ? 2.8 : 1.35,
        opacity: dimmed ? (kind === "place" ? 0.12 : 0.14) : kind === "place" ? 0.5 : 0.85,
      }}
    />
  );
}

export const MemoryEdge = memo(MemoryEdgeInner);
